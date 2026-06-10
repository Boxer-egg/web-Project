<script setup>
import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'

const input = useStorage('json-input', '')
const output = ref('')
const error = ref('')
const indent = useStorage('json-indent', 2)
const copyText = ref('复制结果')

const example = JSON.stringify({
  name: '张三',
  age: 28,
  skills: ['JavaScript', 'Vue', 'Node.js'],
  address: { city: '北京', zip: '100000' },
  active: true
}, null, 2)

function validate() {
  error.value = ''
  if (!input.value.trim()) return false
  try {
    JSON.parse(input.value)
    return true
  } catch (e) {
    error.value = e.message
    return false
  }
}

function format() {
  if (!input.value.trim()) { output.value = ''; return }
  try {
    const obj = JSON.parse(input.value)
    output.value = JSON.stringify(obj, null, indent.value)
    error.value = ''
  } catch (e) {
    error.value = e.message
  }
}

function compress() {
  if (!input.value.trim()) { output.value = ''; return }
  try {
    const obj = JSON.parse(input.value)
    output.value = JSON.stringify(obj)
    error.value = ''
  } catch (e) {
    error.value = e.message
  }
}

function escape() {
  if (!input.value.trim()) { output.value = ''; return }
  output.value = JSON.stringify(input.value).slice(1, -1)
  error.value = ''
}

function unescape() {
  if (!input.value.trim()) { output.value = ''; return }
  try {
    output.value = JSON.parse('"' + input.value + '"')
    error.value = ''
  } catch (e) {
    error.value = '去转义失败：' + e.message
  }
}

async function copy() {
  if (!output.value) return
  try {
    await navigator.clipboard.writeText(output.value)
    copyText.value = '已复制'
    setTimeout(() => copyText.value = '复制结果', 2000)
  } catch {
    copyText.value = '复制失败'
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}

function loadExample() {
  input.value = example
  format()
}

watch(input, () => {
  error.value = ''
}, { immediate: false })

function getUrlParams() {
  const hash = window.location.hash
  const query = hash.split('?')[1] || ''
  return new URLSearchParams(query)
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('input')) {
    input.value = params.get('input')
    format()
  } else if (!input.value) {
    loadExample()
  } else {
    format()
  }
})
</script>

<template>
  <div class="tool-page">
    <h1>📋 JSON 格式化</h1>
    <div class="tool-actions">
      <button class="btn" @click="format">格式化</button>
      <button class="btn btn-secondary" @click="compress">压缩</button>
      <button class="btn btn-secondary" @click="escape">转义</button>
      <button class="btn btn-secondary" @click="unescape">去转义</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">加载示例</button>
      <select v-model="indent" class="input" style="width:auto;min-width:80px">
        <option :value="2">2 空格</option>
        <option :value="4">4 空格</option>
        <option :value="'\t'">Tab</option>
      </select>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea v-model="input" class="textarea" placeholder="在此粘贴 JSON..." rows="20"></textarea>
      </div>
      <div class="tool-panel">
        <h3>输出</h3>
        <textarea v-model="output" class="textarea" placeholder="处理结果..." rows="20" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self:flex-start">{{ copyText }}</button>
      </div>
    </div>
    <div v-if="error" class="error-msg">❌ {{ error }}</div>
  </div>
</template>

<style scoped>
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-top: 10px;
  font-size: 14px;
}
</style>
