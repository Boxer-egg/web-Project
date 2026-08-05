<script setup>
import { ref, computed, watch } from 'vue'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import { useStorage } from '@vueuse/core'
import * as base64Logic from '../../logic/base64'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const toast = useToast()

const mode = useStorage('base64-mode', 'text') // text | file
const isImage = ref(false)
const isNonImage = ref(false)
const imagePreview = ref('')
const fileInfo = ref('')
const isBase64 = ref(false)
const isDragging = ref(false)

function autoProcess(val) {
  if (!val) return ''

  // Data URL → decode as image preview (keep raw for output text mode)
  const dataUrl = base64Logic.extractDataUrl(val)
  if (dataUrl && dataUrl.isBase64) {
    const clean = base64Logic.stripWhitespace(dataUrl.payload)
    if (clean && clean.length > 4) {
      try {
        const decoded = base64Logic.base64ToUtf8(clean)
        isImage.value = dataUrl.mime.startsWith('image/')
        if (isImage.value) imagePreview.value = val
        isBase64.value = true
        return decoded
      } catch {
        /* fall through */
      }
    }
  }

  const cleanInput = base64Logic.stripWhitespace(val)
  if (base64Logic.detectBase64(cleanInput)) {
    isBase64.value = true
    try {
      return base64Logic.base64ToUtf8(cleanInput)
    } catch {
      isBase64.value = false
      return base64Logic.utf8ToBase64(val)
    }
  } else {
    isBase64.value = false
    return base64Logic.utf8ToBase64(val)
  }
}

const {
  input: textInput,
  output,
  error,
  autoMode,
  copyText,
  clearAll: baseClear,
  loadExample,
  process: runAuto,
  copy
} = useTool({
  storageKey: 'base64',
  processor: autoProcess,
  paramMapping: { text: { ref: ref('') } },
  example: 'Hello 世界! 这是一段示例文本。'
})

const inputChars = computed(() => textInput.value.length)

function textToBase64() {
  mode.value = 'text'
  if (!textInput.value) {
    toast.warn('请输入内容')
    return
  }
  try {
    output.value = base64Logic.utf8ToBase64(textInput.value)
    isImage.value = false
    isNonImage.value = false
    imagePreview.value = ''
    fileInfo.value = ''
    error.value = ''
  } catch (e) {
    error.value = '编码失败: ' + e.message
  }
}

function base64ToText() {
  mode.value = 'text'
  if (!textInput.value) {
    toast.warn('请输入内容')
    return
  }
  try {
    output.value = base64Logic.base64ToUtf8(textInput.value)
    isImage.value = false
    isNonImage.value = false
    imagePreview.value = ''
    fileInfo.value = ''
    error.value = ''
  } catch (e) {
    error.value = '解码失败: 无效的 Base64 字符串'
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

async function processFile(file) {
  if (!file) return
  mode.value = 'file'
  if (file.size > 10 * 1024 * 1024) {
    toast.error('文件过大，请上传小于 10MB 的文件')
    return
  }
  try {
    const dataUrl = await readFileAsDataURL(file)
    output.value = dataUrl
    fileInfo.value = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
    if (file.type.startsWith('image/')) {
      isImage.value = true
      isNonImage.value = false
      imagePreview.value = dataUrl
    } else {
      isImage.value = false
      isNonImage.value = true
      imagePreview.value = ''
      toast.warn('该文件类型可能无法正确预览，但编码仍可进行')
    }
    error.value = ''
  } catch (e) {
    error.value = '文件读取失败: ' + e.message
  }
}

function handleFile(e) {
  processFile(e.target.files?.[0])
  e.target.value = ''
}

function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  processFile(file)
}

function onDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function clearAll() {
  baseClear()
  isImage.value = false
  isNonImage.value = false
  imagePreview.value = ''
  fileInfo.value = ''
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🔐 Base64 编解码</h1>
      <AiHelpPanel
        title="Base64 编解码"
        desc="文本与 Base64 互相转换，支持文件拖拽上传为 Base64 DataURL"
        :params="[
          { name: 'text', desc: '要编码/解码的文本或 Base64 字符串', required: true, example: 'Hello World' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-actions">
      <button class="btn" @click="textToBase64">文本 → Base64</button>
      <button class="btn btn-secondary" @click="base64ToText">Base64 → 文本</button>
      <label class="btn btn-secondary" style="cursor:pointer">
        文件 → Base64
        <input type="file" @change="handleFile" style="display:none">
      </label>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">加载示例</button>
    </div>
    <div class="tool-actions">
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
      <span v-if="autoMode && isBase64" style="font-size:11px;color:var(--accent)">已识别为 Base64，自动解码</span>
      <span v-else-if="autoMode && textInput" style="font-size:11px;color:var(--text-muted)">自动编码中</span>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入 <span style="color:var(--text-muted);font-size:12px">{{ inputChars }} 字符</span></h3>
        <div
          class="drop-zone"
          :class="{ dragging: isDragging }"
          @dragover.prevent="onDragOver"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop"
        >
          <textarea v-model="textInput" class="textarea" placeholder="输入文本或 Base64（支持换行 Base64、Data URL）..." rows="14"></textarea>
          <div class="drop-hint">或将文件拖拽到此处</div>
        </div>
      </div>
      <div class="tool-panel">
        <h3>输出 <span v-if="fileInfo" style="color:var(--text-muted);font-size:12px">{{ fileInfo }}</span></h3>
        <img v-if="isImage && imagePreview" :src="imagePreview" style="max-width:100%;max-height:200px;border-radius:var(--radius);margin-bottom:10px">
        <div v-if="isNonImage" class="file-note">⚠️ 非图片文件，无法预览，但编码已完成</div>
        <textarea v-model="output" class="textarea" :placeholder="isImage ? 'Base64 DataURL...' : '处理结果...'" :rows="isImage ? 8 : 14" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self:flex-start">{{ copyText }}</button>
      </div>
    </div>
    <div v-if="error" class="error-msg">❌ {{ error }}</div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-top: 10px;
  font-size: 14px;
}
.drop-zone {
  position: relative;
  border-radius: var(--radius);
}
.drop-zone.dragging {
  outline: 2px dashed var(--accent);
  outline-offset: 4px;
}
.drop-hint {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 12px;
  color: var(--text-muted);
  pointer-events: none;
}
.file-note {
  font-size: 12px;
  color: var(--warning);
  background: rgba(245, 158, 11, 0.1);
  padding: 6px 10px;
  border-radius: var(--radius);
  margin-bottom: 10px;
}
</style>
