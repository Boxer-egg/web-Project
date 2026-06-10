<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const input = useStorage('toolbox-input', '')
const output = ref('')
const findText = useStorage('toolbox-find', '')
const replaceText = useStorage('toolbox-replace', '')
const useRegex = useStorage('toolbox-regex', false)
const copyText = ref('复制结果')

const stats = computed(() => {
  const text = input.value || ''
  const chars = text.length
  const bytes = new Blob([text]).size
  const lines = text === '' ? 0 : text.split('\n').length
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  return { chars, bytes, lines, words }
})

function getUrlParams() {
  const hash = window.location.hash
  const query = hash.split('?')[1] || ''
  return new URLSearchParams(query)
}

function toUpper() { output.value = (input.value || '').toUpperCase() }
function toLower() { output.value = (input.value || '').toLowerCase() }
function toCapitalize() {
  output.value = (input.value || '').replace(/\b\w/g, c => c.toUpperCase())
}
function swapCase() {
  output.value = (input.value || '').replace(/[a-zA-Z]/g, c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())
}
function removeDuplicateLines() {
  const lines = (input.value || '').split('\n')
  const seen = new Set()
  output.value = lines.filter(line => {
    if (seen.has(line)) return false
    seen.add(line)
    return true
  }).join('\n')
}
function removeEmptyLines() {
  output.value = (input.value || '').split('\n').filter(line => line.trim() !== '').join('\n')
}
function trimLines() {
  output.value = (input.value || '').split('\n').map(line => line.trim()).join('\n')
}
function mergeEmptyLines() {
  output.value = input.value.replace(/\n{2,}/g, '\n')
}
function sortAsc() {
  output.value = input.value.split('\n').sort((a, b) => a.localeCompare(b)).join('\n')
}
function sortDesc() {
  output.value = input.value.split('\n').sort((a, b) => b.localeCompare(a)).join('\n')
}
function reverseLines() {
  output.value = input.value.split('\n').reverse().join('\n')
}
function reverseChars() {
  output.value = input.value.split('').reverse().join('')
}
function findReplace() {
  if (!findText.value) { output.value = input.value; return }
  try {
    if (useRegex.value) {
      const re = new RegExp(findText.value, 'g')
      output.value = input.value.replace(re, replaceText.value)
    } else {
      output.value = input.value.split(findText.value).join(replaceText.value)
    }
  } catch (e) {
    output.value = '替换失败: ' + e.message
  }
}
function addLineNumbers() {
  output.value = input.value.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
}
function removeLineNumbers() {
  output.value = input.value.split('\n').map(line => line.replace(/^\s*\d+\.\s*/, '')).join('\n')
}
function toList() {
  output.value = input.value.split('\n').filter(l => l.trim()).map(line => `- ${line.trim()}`).join('\n')
}

const actions = [
  { name: '转大写', fn: toUpper },
  { name: '转小写', fn: toLower },
  { name: '首字母大写', fn: toCapitalize },
  { name: '大小写翻转', fn: swapCase },
  { name: '去重行', fn: removeDuplicateLines },
  { name: '去空行', fn: removeEmptyLines },
  { name: '去首尾空格', fn: trimLines },
  { name: '合并空行', fn: mergeEmptyLines },
  { name: '升序排序', fn: sortAsc },
  { name: '降序排序', fn: sortDesc },
  { name: '反转行序', fn: reverseLines },
  { name: '字符翻转', fn: reverseChars },
  { name: '添加行号', fn: addLineNumbers },
  { name: '删除行号', fn: removeLineNumbers },
  { name: '转列表', fn: toList },
]

function runAction(fn) {
  fn()
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
}

function loadExample() {
  input.value = `apple
banana
Apple
cherry
banana
  hello world  `
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('text')) {
    input.value = params.get('text')
    const action = params.get('action')
    const actionMap = {
      upper: toUpper, lower: toLower, capitalize: toCapitalize, swapcase: swapCase,
      dedup: removeDuplicateLines, noempty: removeEmptyLines, trim: trimLines, mergeempty: mergeEmptyLines,
      sortasc: sortAsc, sortdesc: sortDesc, reverselines: reverseLines, reversechars: reverseChars,
      addlinenum: addLineNumbers, dellinenum: removeLineNumbers, tolist: toList,
    }
    if (actionMap[action]) actionMap[action]()
  } else if (!input.value) {
    loadExample()
  }
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>🧰 文本处理工具箱</h1>
      <AiHelpPanel
        title="文本处理工具箱"
        desc="提供大小写转换、去重去空行、排序翻转、查找替换等 16+ 种文本处理功能"
        :params="[
          { name: 'text', desc: '要处理的文本', required: true, example: 'Hello World' },
          { name: 'action', desc: '操作：upper/lower/capitalize/swapcase/dedup/noempty/trim/mergeempty/sortasc/sortdesc/reverselines/reversechars/addlinenum/dellinenum/tolist', required: false, example: 'upper' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="card" style="margin-bottom:16px;padding:10px 16px;display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--text-secondary)">
      <span>字符: <strong style="color:var(--text-primary)">{{ stats.chars }}</strong></span>
      <span>单词: <strong style="color:var(--text-primary)">{{ stats.words }}</strong></span>
      <span>行数: <strong style="color:var(--text-primary)">{{ stats.lines }}</strong></span>
      <span>字节: <strong style="color:var(--text-primary)">{{ stats.bytes }}</strong></span>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea v-model="input" class="textarea" placeholder="输入文本..." rows="12"></textarea>
        <div class="actions-grid">
          <button v-for="act in actions" :key="act.name" class="btn btn-sm btn-secondary" @click="runAction(act.fn)">
            {{ act.name }}
          </button>
        </div>
        <div class="card" style="margin-top:10px;padding:12px">
          <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">查找替换</div>
          <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            <input v-model="findText" class="input" placeholder="查找" style="flex:1">
            <input v-model="replaceText" class="input" placeholder="替换为" style="flex:1">
          </div>
          <label style="display:flex;align-items:center;gap:4px;font-size:13px;color:var(--text-secondary);cursor:pointer;margin-bottom:8px">
            <input type="checkbox" v-model="useRegex"> 使用正则
          </label>
          <button class="btn btn-sm" @click="findReplace">执行替换</button>
        </div>
      </div>
      <div class="tool-panel">
        <h3>输出</h3>
        <textarea v-model="output" class="textarea" placeholder="处理结果..." rows="20" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self:flex-start">{{ copyText }}</button>
      </div>
    </div>
    <div class="tool-actions" style="margin-top:10px">
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">示例</button>
    </div>
  </div>
</template>

<style scoped>
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 6px;
  margin-top: 10px;
}
</style>
