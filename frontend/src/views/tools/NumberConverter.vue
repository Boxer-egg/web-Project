<script setup>
import { ref, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const input = useStorage('num-input', '')
const fromBase = useStorage('num-from', 10)
const toBases = useStorage('num-to', [2, 8, 16])
const results = ref([])

const baseOptions = [
  { value: 2, label: '二进制 (2)' },
  { value: 8, label: '八进制 (8)' },
  { value: 10, label: '十进制 (10)' },
  { value: 16, label: '十六进制 (16)' },
  { value: 36, label: '三十六进制 (36)' },
]

function getUrlParams() {
  const hash = window.location.hash
  const query = hash.split('?')[1] || ''
  return new URLSearchParams(query)
}

function convert() {
  results.value = []
  if (!input.value.trim()) return

  let numStr = input.value.trim()
  // Auto-detect prefix
  if (numStr.startsWith('0x') || numStr.startsWith('0X')) {
    fromBase.value = 16
    numStr = numStr.slice(2)
  } else if (numStr.startsWith('0b') || numStr.startsWith('0B')) {
    fromBase.value = 2
    numStr = numStr.slice(2)
  } else if (numStr.startsWith('0o') || numStr.startsWith('0O')) {
    fromBase.value = 8
    numStr = numStr.slice(2)
  }

  const decimal = parseInt(numStr, fromBase.value)
  if (isNaN(decimal)) {
    results.value = [{ base: '错误', value: `输入 "${numStr}" 不是有效的 ${fromBase.value} 进制数字` }]
    return
  }

  for (const base of toBases.value) {
    try {
      const converted = decimal.toString(base).toUpperCase()
      results.value.push({ base, label: baseOptions.find(b => b.value === base)?.label || `进制 (${base})`, value: converted })
    } catch {
      results.value.push({ base, label: `进制 (${base})`, value: '转换失败' })
    }
  }
}

function toggleBase(base) {
  const idx = toBases.value.indexOf(base)
  if (idx > -1) {
    if (toBases.value.length > 1) toBases.value.splice(idx, 1)
  } else {
    toBases.value.push(base)
    toBases.value.sort((a, b) => a - b)
  }
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {}
}

async function copyAll() {
  const text = results.value.map(r => `${r.label}: ${r.value}`).join('\n')
  try {
    await navigator.clipboard.writeText(text)
  } catch {}
}

function clearAll() {
  input.value = ''
  results.value = []
}

function loadExample() {
  input.value = '255'
  fromBase.value = 10
  toBases.value = [2, 8, 16]
  convert()
}

function swap() {
  if (results.value.length > 0) {
    const firstBase = toBases.value[0]
    fromBase.value = firstBase
    convert()
  }
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('num')) {
    input.value = params.get('num')
    if (params.get('from')) fromBase.value = parseInt(params.get('from'))
    if (params.get('to')) toBases.value = params.get('to').split(',').map(Number)
    convert()
  } else if (!input.value) {
    loadExample()
  }
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>🔢 进制转换器</h1>
      <AiHelpPanel
        title="进制转换器"
        desc="在二/八/十/十六/三十六进制之间进行相互转换，支持前缀自动识别"
        :params="[
          { name: 'num', desc: '要转换的数字', required: true, example: '255' },
          { name: 'from', desc: '源进制：2/8/10/16/36', required: false, example: '10' },
          { name: 'to', desc: '目标进制，逗号分隔：2,8,16', required: false, example: '2,8,16' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <input v-model="input" class="input" placeholder="输入数字（支持 0x/0b/0o 前缀）">
        <div style="margin-top:12px">
          <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">源进制</label>
          <select v-model="fromBase" class="input">
            <option v-for="b in baseOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
          </select>
        </div>
        <div style="margin-top:12px">
          <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">目标进制</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <label v-for="b in baseOptions" :key="b.value" style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:13px">
              <input type="checkbox" :checked="toBases.includes(b.value)" @change="toggleBase(b.value)">
              {{ b.label }}
            </label>
          </div>
        </div>
        <div class="tool-actions" style="margin-top:16px">
          <button class="btn" @click="convert">转换</button>
          <button class="btn btn-secondary" @click="swap">交换</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
          <button class="btn btn-secondary" @click="loadExample">示例</button>
        </div>
      </div>
      <div class="tool-panel">
        <h3>结果</h3>
        <div v-for="r in results" :key="r.base" class="card" style="margin-bottom:8px;padding:10px 12px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:var(--text-secondary);font-weight:600">{{ r.label }}</span>
            <button class="btn btn-sm btn-secondary" @click="copy(r.value)">复制</button>
          </div>
          <code style="font-size:14px;word-break:break-all">{{ r.value }}</code>
        </div>
        <div v-if="!results.length" style="color:var(--text-muted);padding:40px;text-align:center">
          输入数字并点击转换
        </div>
        <button v-if="results.length" class="btn btn-sm btn-secondary" @click="copyAll">复制全部</button>
      </div>
    </div>
  </div>
</template>
