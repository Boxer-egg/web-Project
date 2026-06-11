<script setup>
import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import * as hashLogic from '../../logic/hash'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const selected = useStorage('hash-selected', ['md5', 'sha256'])
const results = ref({})
const fileMode = ref(false)
const fileName = ref('')
const toast = useToast()

const algos = [
  { key: 'md5', label: 'MD5' },
  { key: 'sha1', label: 'SHA1' },
  { key: 'sha256', label: 'SHA256' },
  { key: 'sha512', label: 'SHA512' },
]

const {
  input,
  autoMode,
  clearAll: baseClear,
  loadExample,
  process: calculate
} = useTool({
  storageKey: 'hash',
  processor: async (val) => {
    if (fileMode.value) return results.value // Don't auto-calculate for files via this processor
    const res = await hashLogic.calculateAll(val, selected.value)
    results.value = res
    return '' // output isn't used as we use results ref
  },
  paramMapping: { 
    text: { ref: ref('') },
    algorithms: { ref: selected, transform: v => v.split(',') }
  },
  example: 'Hello 世界! 123'
})

watch(selected, () => {
  if (autoMode.value && !fileMode.value) calculate()
}, { deep: true })

async function handleFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  fileName.value = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
  fileMode.value = true
  const buffer = await file.arrayBuffer()
  results.value = await hashLogic.calculateAll(buffer, selected.value)
}

function copy(text) {
  navigator.clipboard.writeText(text)
  toast.success('已复制')
}

function copyAll() {
  const lines = Object.entries(results.value).map(([k, v]) => `${k.toUpperCase()}: ${v}`)
  navigator.clipboard.writeText(lines.join('\n'))
  toast.success('全部已复制')
}

function clearAll() {
  baseClear()
  results.value = {}
  fileName.value = ''
  fileMode.value = false
}

function toggleAlgo(key) {
  const idx = selected.value.indexOf(key)
  if (idx > -1) {
    if (selected.value.length > 1) selected.value.splice(idx, 1)
  } else {
    selected.value.push(key)
  }
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>#️⃣ Hash 计算器</h1>
      <AiHelpPanel
        title="Hash 计算器"
        desc="计算文本或文件的 MD5/SHA1/SHA256/SHA512 哈希值"
        :params="[
          { name: 'text', desc: '要计算的文本', required: true, example: 'Hello' },
          { name: 'algorithms', desc: '算法列表，逗号分隔：md5,sha1,sha256,sha512', required: false, example: 'sha256,sha512' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="card" style="margin-bottom:16px;padding:12px 16px">
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">选择算法：</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <label v-for="algo in algos" :key="algo.key" style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:14px">
          <input type="checkbox" :checked="selected.includes(algo.key)" @change="toggleAlgo(algo.key)">
          {{ algo.label }}
        </label>
      </div>
    </div>
    <div class="tool-actions">
      <button class="btn" @click="calculate">计算</button>
      <label class="btn btn-secondary" style="cursor:pointer">
        上传文件
        <input type="file" @change="handleFile" style="display:none">
      </label>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">示例</button>
    </div>
    <div style="margin-bottom:16px">
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea v-model="input" class="textarea" placeholder="输入文本..." rows="14" :disabled="fileMode"></textarea>
        <div v-if="fileName" style="margin-top:8px;font-size:13px;color:var(--accent)">📎 {{ fileName }}</div>
      </div>
      <div class="tool-panel">
        <h3>结果</h3>
        <div v-for="algo in algos" :key="algo.key" style="margin-bottom:12px">
          <div v-if="results[algo.key]" style="background:var(--bg-secondary);padding:10px 12px;border-radius:var(--radius);border:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:12px;color:var(--text-secondary);font-weight:600">{{ algo.label }}</span>
              <button class="btn btn-sm btn-secondary" @click="copy(results[algo.key])">复制</button>
            </div>
            <code style="font-size:12px;word-break:break-all;color:var(--text-primary)">{{ results[algo.key] }}</code>
          </div>
        </div>
        <div v-if="Object.keys(results).length" style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-sm btn-secondary" @click="copyAll">复制全部</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
