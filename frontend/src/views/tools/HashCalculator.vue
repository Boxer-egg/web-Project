<script setup>
import { ref, watch, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import md5 from 'js-md5'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const input = useStorage('hash-input', '')
const selected = useStorage('hash-selected', ['md5', 'sha256'])
const results = ref({})
const fileMode = ref(false)
const fileName = ref('')
const copyText = ref('')
const autoMode = useStorage('hash-auto', true)

const algos = [
  { key: 'md5', label: 'MD5' },
  { key: 'sha1', label: 'SHA1' },
  { key: 'sha256', label: 'SHA256' },
  { key: 'sha512', label: 'SHA512' },
]

function getUrlParams() {
  // History mode: read from search
  return new URLSearchParams(window.location.search)
}

const algoMap = { sha1: 'SHA-1', sha256: 'SHA-256', sha512: 'SHA-512' }

watch([input, selected], () => {
  if (autoMode.value && !fileMode.value) calculate()
}, { deep: true })

watch(autoMode, (v) => {
  if (v && input.value) calculate()
})

async function computeHash(algo, text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  if (algo === 'md5') {
    return md5(text)
  }
  const webAlgo = algoMap[algo]
  if (!webAlgo) {
    throw new Error(`不支持的算法: ${algo}`)
  }
  const hash = await crypto.subtle.digest(webAlgo, data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function calculate() {
  results.value = {}
  if (!input.value.trim() && !fileMode.value) {
    return
  }
  if (!selected.value.length) {
    return
  }
  for (const algo of selected.value) {
    try {
      results.value[algo] = await computeHash(algo, input.value)
    } catch (e) {
      results.value[algo] = '计算失败: ' + e.message
    }
  }
}

async function handleFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  fileName.value = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
  fileMode.value = true
  const buffer = await file.arrayBuffer()
  results.value = {}
  for (const algo of selected.value) {
    try {
      if (algo === 'md5') {
        results.value[algo] = md5(buffer)
      } else {
        const hash = await crypto.subtle.digest(algo.toUpperCase().replace('SHA', 'SHA-'), buffer)
        results.value[algo] = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
      }
    } catch (e) {
      results.value[algo] = '计算失败'
    }
  }
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    copyText.value = '已复制'
    setTimeout(() => copyText.value = '', 2000)
  } catch {}
}

async function copyAll() {
  const lines = Object.entries(results.value).map(([k, v]) => `${k.toUpperCase()}: ${v}`)
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    copyText.value = '全部已复制'
    setTimeout(() => copyText.value = '', 2000)
  } catch {}
}

function clearAll() {
  input.value = ''
  results.value = {}
  fileName.value = ''
  fileMode.value = false
}

function loadExample() {
  input.value = 'Hello 世界! 123'
  fileMode.value = false
  calculate()
}

function toggleAlgo(key) {
  const idx = selected.value.indexOf(key)
  if (idx > -1) {
    if (selected.value.length > 1) selected.value.splice(idx, 1)
  } else {
    selected.value.push(key)
  }
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('text')) {
    input.value = params.get('text')
    if (params.get('algorithms')) {
      selected.value = params.get('algorithms').split(',')
    }
    calculate()
  } else if (!input.value) {
    loadExample()
  } else {
    calculate()
  }
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
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
        <p v-if="copyText" style="color:var(--success);font-size:13px;margin-top:6px">{{ copyText }}</p>
      </div>
    </div>
  </div>
</template>
