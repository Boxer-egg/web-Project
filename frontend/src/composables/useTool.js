import { ref, watch, onMounted, nextTick } from 'vue'
import { useStorage, useDebounceFn } from '@vueuse/core'
import { getUrlParams, applyParams } from '../utils/urlParams'
import { useToast } from './useToast'

/**
 * useTool composable to centralize common tool logic.
 * @param {Object} options
 * @param {string} options.storageKey - Key for localStorage persistence.
 * @param {Function} options.processor - Main function to process input to output.
 * @param {Object} options.paramMapping - URL parameter mapping config.
 * @param {string} [options.example] - Optional example input.
 * @param {Ref} [options.customInput] - Optional custom input ref.
 * @param {number} [options.debounce] - Debounce time for storage and processing (ms).
 */
export function useTool({ storageKey, processor, paramMapping = {}, example, customInput, debounce = 300 }) {
  // We use a local ref for immediate UI updates, and useStorage for persistence
  const storageInput = useStorage(`${storageKey}-input`, '')
  const input = customInput || ref(storageInput.value)
  const output = ref('')
  const error = ref('')
  const autoMode = useStorage(`${storageKey}-auto`, true)
  const copyText = ref('复制结果')
  const toast = useToast()

  // Sync storage input to local input on load
  if (!customInput) {
    input.value = storageInput.value
  }

  const finalParamMapping = {
    ...paramMapping
  }
  
  // If input isn't already in mapping, add it
  if (!finalParamMapping.input && !customInput) {
    finalParamMapping.input = { ref: input }
  } else if (finalParamMapping.input && !customInput) {
    finalParamMapping.input.ref = input
  }

  const syncStorage = useDebounceFn((val) => {
    storageInput.value = val
  }, debounce)

  const debouncedProcess = useDebounceFn(() => {
    process()
  }, debounce)

  async function process() {
    if (!input.value || !input.value.trim()) {
      output.value = ''
      error.value = ''
      return
    }
    try {
      const res = processor(input.value)
      if (res instanceof Promise) {
        output.value = await res
      } else {
        output.value = res
      }
      error.value = ''
    } catch (e) {
      error.value = e.message
    }
  }

  function clearAll() {
    input.value = ''
    storageInput.value = ''
    output.value = ''
    error.value = ''
  }

  function loadExample() {
    if (example) {
      input.value = example
      process()
    }
  }

  async function copy() {
    if (!output.value) return
    try {
      await navigator.clipboard.writeText(output.value)
      copyText.value = '已复制'
      toast.success('已复制到剪贴板')
      setTimeout(() => copyText.value = '复制结果', 2000)
    } catch {
      copyText.value = '复制失败'
      toast.error('复制失败')
    }
  }

  watch(input, (newVal) => {
    syncStorage(newVal)
    if (autoMode.value) {
      debouncedProcess()
    } else if (!newVal) {
      output.value = ''
    }
  })

  onMounted(() => {
    const params = getUrlParams()
    const hasParams = applyParams(params, {
      ...finalParamMapping,
      auto: { ref: autoMode, transform: v => v === '1' }
    })

    if (hasParams) {
      nextTick(() => process())
    } else if (!input.value && example) {
      loadExample()
    } else if (input.value) {
      process()
    }
  })

  return {
    input,
    output,
    error,
    autoMode,
    copyText,
    clearAll,
    loadExample,
    process,
    copy
  }
}
