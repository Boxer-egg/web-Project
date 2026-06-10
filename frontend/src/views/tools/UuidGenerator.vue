<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const count = useStorage('uuid-count', 10)
const format = useStorage('uuid-format', 'standard')
const prefix = useStorage('uuid-prefix', '')
const suffix = useStorage('uuid-suffix', '')
const results = ref([])
const copied = ref(false)

const formats = [
  { value: 'standard', label: '标准格式 (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)' },
  { value: 'nohyphen', label: '无横线 (xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx)' },
  { value: 'uppercase', label: '大写 (XXXXXXXX-XXXX-4XXX-YXXX-XXXXXXXXXXXX)' },
  { value: 'quoted', label: '带引号 (\'xxx\')' },
  { value: 'array', label: '数组 ([\'xxx\', \'yyy\'])' },
]

function getUrlParams() {
  // History mode: read from search
  return new URLSearchParams(window.location.search)
}

function generateUUID() {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  arr[6] = (arr[6] & 0x0f) | 0x40
  arr[8] = (arr[8] & 0x3f) | 0x80
  const hex = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-${hex.slice(16,18)}${hex.slice(18,20)}-${hex.slice(20,32)}`
}

function formatUUID(uuid) {
  let s = uuid
  switch (format.value) {
    case 'nohyphen': s = s.replace(/-/g, ''); break
    case 'uppercase': s = s.toUpperCase(); break
    case 'quoted': s = `'${s}'`; break
  }
  return prefix.value + s + suffix.value
}

function generate() {
  const uuids = []
  const n = Math.max(1, Math.min(100, count.value))
  for (let i = 0; i < n; i++) {
    uuids.push(generateUUID())
  }

  if (format.value === 'array') {
    results.value = [`[${uuids.map(u => `'${u}'`).join(', ')}]`]
  } else {
    results.value = uuids.map(formatUUID)
  }
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch {}
}

async function copyAll() {
  try {
    await navigator.clipboard.writeText(results.value.join('\n'))
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch {}
}

function exportTxt() {
  const blob = new Blob([results.value.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'uuids.txt'
  a.click()
  URL.revokeObjectURL(url)
}

function clearAll() {
  results.value = []
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('auto') === '1') {
    if (params.get('count')) {
      const c = parseInt(params.get('count'), 10)
      count.value = isNaN(c) ? 10 : Math.max(1, Math.min(100, c))
    }
    if (params.get('format')) format.value = params.get('format')
    if (params.get('prefix')) prefix.value = params.get('prefix')
    if (params.get('suffix')) suffix.value = params.get('suffix')
    generate()
  } else if (!results.value.length) {
    generate()
  }
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>🆔 UUID 生成器</h1>
      <AiHelpPanel
        title="UUID 生成器"
        desc="批量生成 UUID v4，支持多种输出格式"
        :params="[
          { name: 'count', desc: '生成数量 (1-100)', required: false, example: '10' },
          { name: 'format', desc: '输出格式：standard/nohyphen/uppercase/quoted/array', required: false, example: 'standard' },
          { name: 'prefix', desc: '前缀字符串', required: false, example: '' },
          { name: 'suffix', desc: '后缀字符串', required: false, example: '' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-section">
      <div class="tool-panel card">
        <h3>配置</h3>
        <div style="margin-bottom:12px">
          <label style="font-size:13px;color:var(--text-secondary)">数量: {{ count }}</label>
          <input type="range" v-model.number="count" min="1" max="100" style="width:100%">
        </div>
        <div style="margin-bottom:12px">
          <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">格式</label>
          <select v-model="format" class="input">
            <option v-for="f in formats" :key="f.value" :value="f.value">{{ f.label }}</option>
          </select>
        </div>
        <div style="margin-bottom:12px">
          <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">前缀</label>
          <input v-model="prefix" class="input" placeholder="可选">
        </div>
        <div style="margin-bottom:12px">
          <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">后缀</label>
          <input v-model="suffix" class="input" placeholder="可选">
        </div>
        <div class="tool-actions" style="margin-top:16px">
          <button class="btn" @click="generate">生成</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
        </div>
      </div>
      <div class="tool-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>结果 <span v-if="results.length" style="color:var(--text-muted);font-size:12px">({{ results.length }} 个)</span></h3>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm btn-secondary" @click="copyAll">复制全部</button>
            <button class="btn btn-sm btn-secondary" @click="exportTxt">导出 TXT</button>
          </div>
        </div>
        <div class="result-list">
          <div v-for="(uuid, i) in results" :key="i" class="result-item">
            <code class="uuid-text">{{ uuid }}</code>
            <button class="btn btn-sm btn-secondary" @click="copy(uuid)">复制</button>
          </div>
          <div v-if="!results.length" style="color:var(--text-muted);padding:40px;text-align:center">
            点击"生成"按钮创建 UUID
          </div>
        </div>
        <p v-if="copied" style="color:var(--success);font-size:13px;margin-top:6px">已复制</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 500px;
  overflow: auto;
}
.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.uuid-text {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  word-break: break-all;
  background: none;
  color: var(--text-primary);
}
</style>
