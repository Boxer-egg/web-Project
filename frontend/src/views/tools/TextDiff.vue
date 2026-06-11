<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUrlParams } from '../../utils/urlParams'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'


const left = useStorage('diff-left', '')
const right = useStorage('diff-right', '')
const mode = useStorage('diff-mode', 'line')
const ignoreSpace = useStorage('diff-ignore-space', false)
const copyText = ref('复制差异')

function normalize(s) {
  return ignoreSpace.value ? s.replace(/\s+/g, ' ').trim() : s
}

function diffLines(oldStr, newStr) {
  const oldLines = oldStr.split('\n')
  const newLines = newStr.split('\n')
  const result = []
  let i = 0, j = 0
  while (i < oldLines.length || j < newLines.length) {
    const o = normalize(oldLines[i] || '')
    const n = normalize(newLines[j] || '')
    if (i >= oldLines.length) {
      result.push({ type: 'add', text: newLines[j] })
      j++
    } else if (j >= newLines.length) {
      result.push({ type: 'del', text: oldLines[i] })
      i++
    } else if (o === n) {
      result.push({ type: 'same', text: oldLines[i] })
      i++; j++
    } else {
      result.push({ type: 'del', text: oldLines[i] })
      result.push({ type: 'add', text: newLines[j] })
      i++; j++
    }
  }
  return result
}

function diffChars(oldStr, newStr) {
  // 字符级对比：对每一对 del/add 行做字符级高亮
  const lines = diffLines(oldStr, newStr)
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.type === 'del' && i + 1 < lines.length && lines[i + 1].type === 'add') {
      const oldText = line.text
      const newText = lines[i + 1].text
      const { oldHtml, newHtml } = charDiffHtml(oldText, newText)
      result.push({ type: 'del', text: oldText, html: oldHtml })
      result.push({ type: 'add', text: newText, html: newHtml })
      i++
    } else {
      result.push(line)
    }
  }
  return result
}

function charDiffHtml(oldText, newText) {
  // 简化的字符级 diff：逐字符对比
  const maxLen = Math.max(oldText.length, newText.length)
  let oldHtml = ''
  let newHtml = ''
  for (let i = 0; i < maxLen; i++) {
    const oc = oldText[i] || ''
    const nc = newText[i] || ''
    if (oc === nc) {
      oldHtml += escapeHtml(oc)
      newHtml += escapeHtml(nc)
    } else {
      oldHtml += `<span style="background:rgba(239,68,68,0.3);text-decoration:line-through">${escapeHtml(oc || ' ')}</span>`
      newHtml += `<span style="background:rgba(34,197,94,0.3)">${escapeHtml(nc || ' ')}</span>`
    }
  }
  return { oldHtml, newHtml }
}

function escapeHtml(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const diffResult = computed(() => {
  if (!left.value && !right.value) return []
  if (mode.value === 'line') return diffLines(left.value, right.value).map((d, i) => ({ ...d, lineNum: i + 1 }))
  return diffChars(left.value, right.value).map((d, i) => ({ ...d, lineNum: i + 1 }))
})

const stats = computed(() => {
  const adds = diffResult.value.filter(d => d.type === 'add').length
  const dels = diffResult.value.filter(d => d.type === 'del').length
  return { adds, dels }
})

function swap() {
  const tmp = left.value
  left.value = right.value
  right.value = tmp
}

async function copy() {
  const text = diffResult.value.map(d => {
    const prefix = d.type === 'add' ? '+' : d.type === 'del' ? '-' : ' '
    return prefix + ' ' + d.text
  }).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    copyText.value = '已复制'
    setTimeout(() => copyText.value = '复制差异', 2000)
  } catch {
    copyText.value = '复制失败'
  }
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('text1')) left.value = params.get('text1')
  if (params.get('text2')) right.value = params.get('text2')
  if (params.get('mode') === 'char' || params.get('mode') === 'line') mode.value = params.get('mode')
})

function clearAll() {
  left.value = ''
  right.value = ''
}

function loadExample() {
  left.value = `function add(a, b) {
  return a + b;
}

const result = add(1, 2);
console.log(result);`
  right.value = `function add(a, b, c) {
  return a + b + (c || 0);
}

const result = add(1, 2, 3);
console.log(result);`
}
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>📊 文本差异对比</h1>
      <AiHelpPanel
        title="文本差异对比"
        desc="对比两段文本的行级和字符级差异"
        :params="[
          { name: 'text1', desc: '原始文本', required: true, example: 'function add(a,b){return a+b}' },
          { name: 'text2', desc: '对比文本', required: true, example: 'function add(a,b,c){return a+b+c}' },
          { name: 'mode', desc: '对比模式：line（行级）或 char（字符级）', required: false, example: 'line' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-actions">
      <label><input type="radio" v-model="mode" value="line"> 行级</label>
      <label><input type="radio" v-model="mode" value="char"> 字符级</label>
      <label><input type="checkbox" v-model="ignoreSpace"> 忽略空白</label>
      <button class="btn" @click="swap">交换内容</button>
      <button class="btn btn-secondary" @click="copy">{{ copyText }}</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">示例</button>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>原文本</h3>
        <textarea v-model="left" class="textarea" placeholder="输入原文本..." rows="12"></textarea>
      </div>
      <div class="tool-panel">
        <h3>对比文本</h3>
        <textarea v-model="right" class="textarea" placeholder="输入对比文本..." rows="12"></textarea>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h3 style="font-size:14px">差异结果</h3>
        <span style="font-size:13px;color:var(--text-secondary)">
          <span style="color:var(--error)">-{{ stats.dels }}</span> /
          <span style="color:var(--success)">+{{ stats.adds }}</span>
        </span>
      </div>
      <div class="diff-result">
        <div v-for="(line, i) in diffResult" :key="i" :class="['diff-line', line.type]">
          <span class="diff-linenum">{{ line.lineNum }}</span>
          <span class="diff-prefix">{{ line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ' }}</span>
          <span class="diff-text" v-if="line.html" v-html="line.html"></span>
          <span class="diff-text" v-else>{{ line.text || ' ' }}</span>
        </div>
        <div v-if="!diffResult.length" style="color:var(--text-muted);padding:20px;text-align:center">
          输入两段文本进行对比
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
label {
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.diff-result {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  max-height: 400px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.diff-line {
  padding: 2px 8px;
  display: flex;
  gap: 8px;
  white-space: pre-wrap;
  word-break: break-all;
}
.diff-line.add {
  background: rgba(34, 197, 94, 0.1);
}
.diff-line.del {
  background: rgba(239, 68, 68, 0.1);
}
.diff-linenum {
  user-select: none;
  flex-shrink: 0;
  width: 32px;
  text-align: right;
  color: var(--text-muted);
  font-size: 12px;
  margin-right: 4px;
}
.diff-prefix {
  user-select: none;
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}
.diff-line.add .diff-prefix { color: var(--success) }
.diff-line.del .diff-prefix { color: var(--error) }
</style>
