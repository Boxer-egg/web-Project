<script setup>
import { ref, computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import * as regexLogic from '../../logic/regex'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const pattern = useStorage('regex-pattern', '')
const flags = useStorage('regex-flags', 'g')
const matches = ref([])

const {
  input: testText,
  error,
  clearAll: baseClear
} = useTool({
  storageKey: 'regex',
  processor: (val) => val,
  paramMapping: { text: { ref: ref('') } }
})

const matchCount = computed(() => matches.value.length)

function runTest() {
  const { matches: m, error: e } = regexLogic.testRegex(testText.value, pattern.value, flags.value)
  matches.value = m
  error.value = e
}

watch([testText, pattern, flags], () => {
  runTest()
})

function escapeHtml(t) {
  return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const highlightedHtml = computed(() => {
  if (!testText.value) return ''
  if (!matches.value.length) return escapeHtml(testText.value)
  
  let result = ''
  let last = 0
  matches.value.forEach((match) => {
    result += escapeHtml(testText.value.slice(last, match.start))
    result += `<span style="background:rgba(234, 179, 8, 0.3)">${escapeHtml(match.text)}</span>`
    last = match.end
  })
  result += escapeHtml(testText.value.slice(last))
  return result
})

function clearAll() {
  baseClear()
  pattern.value = ''
  matches.value = []
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🔍 正则测试器</h1>
      <AiHelpPanel
        title="正则测试器"
        desc="实时测试正则表达式，支持 flags 配置和匹配高亮"
        api-tool="regex"
        :params="[
          { name: 'text', desc: '测试文本', required: true, example: 'Hello World' },
          { name: 'pattern', desc: '正则表达式', required: false, example: '\\w+' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="card config-bar">
      <div class="config-row">
        <input v-model="pattern" class="input" placeholder="正则表达式 (例如: \w+)" style="flex:1">
        <input v-model="flags" class="input" placeholder="flags (例如: g)" style="width:80px">
      </div>
    </div>
    <div class="tool-actions">
      <button class="btn" @click="runTest">测试</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>测试文本</h3>
        <textarea v-model="testText" class="textarea" placeholder="输入文本..." rows="12"></textarea>
      </div>
      <div class="tool-panel">
        <h3>匹配结果 ({{ matchCount }})</h3>
        <div class="highlight-box" v-html="highlightedHtml"></div>
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
.config-bar {
  margin-bottom: 16px;
  padding: 12px;
}
.config-row {
  display: flex;
  gap: 8px;
}
.highlight-box {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  min-height: 200px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
}
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-top: 10px;
  font-size: 14px;
}
</style>
