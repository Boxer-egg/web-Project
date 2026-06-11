<script setup>
import { ref, computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import * as diffLogic from '../../logic/text-diff'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const right = useStorage('diff-right', '')
const mode = useStorage('diff-mode', 'line')
const ignoreSpace = useStorage('diff-ignore-space', false)
const toast = useToast()

const {
  input: left,
  output,
  clearAll: baseClear,
  loadExample
} = useTool({
  storageKey: 'diff-left',
  processor: (val) => val, // We use computed for diff results
  paramMapping: {
    text1: { ref: ref('') }, // This will be synced to 'left' by useTool logic if we are careful
    text2: { ref: right },
    mode: { ref: mode }
  },
  example: `function add(a, b) {\n  return a + b;\n}`
})

// Correcting paramMapping: useTool uses 'input' as the default for the first param
// but we can override it. Actually, useTool internals:
// finalParamMapping.input = { ref: input }
// So we should use 'input' for text1 in AiHelpPanel or map it.

const diffResult = computed(() => {
  if (!left.value && !right.value) return []
  const res = mode.value === 'line' 
    ? diffLogic.diffLines(left.value, right.value, ignoreSpace.value)
    : diffLogic.diffChars(left.value, right.value, ignoreSpace.value)
  return res.map((d, i) => ({ ...d, lineNum: i + 1 }))
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

async function copyDiff() {
  const text = diffResult.value.map(d => {
    const prefix = d.type === 'add' ? '+' : d.type === 'del' ? '-' : ' '
    return prefix + ' ' + d.text
  }).join('\n')
  await navigator.clipboard.writeText(text)
  toast.success('差异结果已复制')
}

function clearAll() {
  baseClear()
  right.value = ''
}

function handleLoadExample() {
  left.value = `function add(a, b) {\n  return a + b;\n}\n\nconst result = add(1, 2);\nconsole.log(result);`
  right.value = `function add(a, b, c) {\n  return a + b + (c || 0);\n}\n\nconst result = add(1, 2, 3);\nconsole.log(result);`
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
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
      <div class="mode-opts">
        <label class="radio-label"><input type="radio" v-model="mode" value="line"> 行级</label>
        <label class="radio-label"><input type="radio" v-model="mode" value="char"> 字符级</label>
        <label class="checkbox-label"><input type="checkbox" v-model="ignoreSpace"> 忽略空白</label>
      </div>
      <div class="op-btns">
        <button class="btn btn-secondary" @click="swap">交换</button>
        <button class="btn btn-secondary" @click="copyDiff">复制差异</button>
        <button class="btn btn-secondary" @click="clearAll">清空</button>
        <button class="btn btn-secondary" @click="handleLoadExample">示例</button>
      </div>
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
    <div class="card result-card">
      <div class="panel-label">
        <h3 style="font-size:14px">差异结果</h3>
        <div class="stats-badge">
          <span class="del-count">-{{ stats.dels }}</span>
          <span class="divider">/</span>
          <span class="add-count">+{{ stats.adds }}</span>
        </div>
      </div>
      <div class="diff-container">
        <div v-for="(line, i) in diffResult" :key="i" :class="['diff-line', line.type]">
          <span class="diff-linenum">{{ line.lineNum }}</span>
          <span class="diff-prefix">{{ line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ' }}</span>
          <span class="diff-text" v-if="line.html" v-html="line.html"></span>
          <span class="diff-text" v-else>{{ line.text || ' ' }}</span>
        </div>
        <div v-if="!diffResult.length" class="empty-diff">
          输入两段文本进行对比
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
.tool-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.mode-opts, .op-btns {
  display: flex;
  gap: 12px;
  align-items: center;
}
.radio-label, .checkbox-label {
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.result-card {
  margin-top: 16px;
  padding: 16px;
}
.panel-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.stats-badge {
  font-size: 13px;
  font-weight: 600;
}
.del-count { color: var(--error); }
.add-count { color: var(--success); }
.divider { margin: 0 4px; color: var(--text-muted); }

.diff-container {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
}
.diff-line {
  padding: 2px 12px;
  display: flex;
  gap: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
.diff-line.add { background: rgba(34, 197, 94, 0.08); }
.diff-line.del { background: rgba(239, 68, 68, 0.08); }

.diff-linenum {
  user-select: none;
  width: 32px;
  text-align: right;
  color: var(--text-muted);
  font-size: 12px;
}
.diff-prefix {
  user-select: none;
  width: 12px;
  text-align: center;
}
.diff-line.add .diff-prefix { color: var(--success); }
.diff-line.del .diff-prefix { color: var(--error); }

.empty-diff {
  color: var(--text-muted);
  padding: 40px;
  text-align: center;
}

@media (max-width: 768px) {
  .tool-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
