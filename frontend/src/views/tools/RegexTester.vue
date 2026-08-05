<script setup>
import { ref, computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import * as regexLogic from '../../logic/regex'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const toast = useToast()

const pattern = useStorage('regex-pattern', '')
const flagG = useStorage('regex-flag-g', true)
const flagI = useStorage('regex-flag-i', false)
const flagM = useStorage('regex-flag-m', false)
const replacement = ref('')
const matches = ref([])
const replaceResult = ref('')
const showReplace = ref(false)
const showGroups = ref(false)

const {
  input: testText,
  error,
  clearAll: baseClear
} = useTool({
  storageKey: 'regex',
  processor: (val) => val,
  paramMapping: { text: { ref: ref('') } }
})

const flags = computed(() => {
  let f = ''
  if (flagG.value) f += 'g'
  if (flagI.value) f += 'i'
  if (flagM.value) f += 'm'
  return f
})

const matchCount = computed(() => matches.value.length)
const groupRows = computed(() => {
  if (!matches.value.length) return []
  const rows = []
  matches.value.forEach((match, mi) => {
    if (match.groups.length) {
      match.groups.forEach((g, gi) => {
        rows.push({
          matchIndex: mi + 1,
          groupIndex: gi + 1,
          name: (match.groupNames && match.groupNames[gi]) || '',
          value: g === undefined ? '' : g
        })
      })
    }
  })
  return rows
})

const highlightColors = [
  'rgba(234, 179, 8, 0.3)',
  'rgba(59, 130, 246, 0.3)',
  'rgba(16, 185, 129, 0.3)',
  'rgba(239, 68, 68, 0.3)',
  'rgba(168, 85, 247, 0.3)',
  'rgba(236, 72, 153, 0.3)'
]

function runTest() {
  const { matches: m, error: e } = regexLogic.testRegex(testText.value, pattern.value, flags.value)
  matches.value = m
  error.value = e
}

function runReplace() {
  const { result, error: e } = regexLogic.replaceText(testText.value, pattern.value, flags.value, replacement.value)
  replaceResult.value = result
  error.value = e
}

watch([testText, pattern, flagG, flagI, flagM], () => {
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

    const hasIndices = match.groupIndices && match.groupIndices.length &&
      match.groupIndices.some(g => g && g[1] > g[0])

    if (hasIndices) {
      // 有分组位置信息时，用不同颜色高亮各捕获组
      const segs = []
      match.groupIndices.forEach((g, i) => {
        if (!g || g[1] <= g[0]) return
        segs.push({ start: g[0], end: g[1], color: highlightColors[(i + 1) % highlightColors.length] })
      })
      segs.sort((a, b) => a.start - b.start)
      let cursor = match.start
      for (const seg of segs) {
        if (seg.start > cursor) {
          result += `<span style="background:${highlightColors[0]}">${escapeHtml(testText.value.slice(cursor, seg.start))}</span>`
        }
        result += `<span style="background:${seg.color}">${escapeHtml(testText.value.slice(seg.start, seg.end))}</span>`
        cursor = seg.end
      }
      if (cursor < match.end) {
        result += `<span style="background:${highlightColors[0]}">${escapeHtml(testText.value.slice(cursor, match.end))}</span>`
      }
    } else {
      const color = match.groups.length ? highlightColors[0] : 'rgba(234, 179, 8, 0.3)'
      result += `<span style="background:${color}">${escapeHtml(match.text)}</span>`
    }
    last = match.end
  })
  result += escapeHtml(testText.value.slice(last))
  return result
})

function applyPreset(e) {
  const name = e.target.value
  if (!name) return
  const preset = regexLogic.PRESETS.find(p => p.name === name)
  if (preset) {
    pattern.value = preset.pattern
    flagG.value = preset.flags.includes('g')
    flagI.value = preset.flags.includes('i')
    flagM.value = preset.flags.includes('m')
    toast.success(`已加载：${preset.desc}`)
  }
  e.target.value = ''
}

function toggleReplace() {
  showReplace.value = !showReplace.value
  if (showReplace.value) runReplace()
}

function toggleGroups() {
  showGroups.value = !showGroups.value
}

function copyText(text) {
  if (!text) {
    toast.warn('没有可复制的内容')
    return
  }
  navigator.clipboard.writeText(text)
  toast.success('已复制')
}

function loadExample() {
  pattern.value = '\\d{3}-\\d{4}'
  flagG.value = true
  flagI.value = false
  flagM.value = false
  testText.value = '电话: 010-1234567 或 021-8888888\n手机: 138-0000-0000'
  replacement.value = '***'
}

function clearAll() {
  baseClear()
  pattern.value = ''
  matches.value = []
  replaceResult.value = ''
  replacement.value = ''
  showReplace.value = false
  showGroups.value = false
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🔍 正则测试器</h1>
      <AiHelpPanel
        title="正则测试器"
        desc="实时测试正则表达式，支持匹配、替换和分组提取"
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
      </div>
      <div class="config-row">
        <label class="flag-label"><input type="checkbox" v-model="flagG"> g（全局）</label>
        <label class="flag-label"><input type="checkbox" v-model="flagI"> i（忽略大小写）</label>
        <label class="flag-label"><input type="checkbox" v-model="flagM"> m（多行）</label>
        <select class="input preset-select" @change="applyPreset">
          <option value="">常用正则库…</option>
          <option v-for="p in regexLogic.PRESETS" :key="p.name" :value="p.name">{{ p.name }}</option>
        </select>
      </div>
    </div>
    <div class="tool-actions">
      <button class="btn" @click="runTest">匹配测试</button>
      <button class="btn btn-secondary" @click="toggleReplace">{{ showReplace ? '隐藏替换' : '替换测试' }}</button>
      <button class="btn btn-secondary" @click="toggleGroups">{{ showGroups ? '隐藏分组' : '提取分组' }}</button>
      <button class="btn btn-secondary" @click="loadExample">加载示例</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>测试文本</h3>
        <textarea v-model="testText" class="textarea" placeholder="输入文本..." rows="12"></textarea>
        <div v-if="showReplace" style="margin-top:8px">
          <h3 style="margin-bottom:6px">替换文本</h3>
          <input v-model="replacement" class="input" placeholder="替换为 (支持 $1, $2 引用分组)">
          <div class="replace-result" v-if="replaceResult">替换结果：{{ replaceResult }}</div>
        </div>
      </div>
      <div class="tool-panel">
        <h3>匹配结果 ({{ matchCount }})</h3>
        <div class="highlight-box" v-html="highlightedHtml"></div>
        <div class="result-actions">
          <button class="btn btn-sm" @click="copyText(testText)">复制文本</button>
          <button class="btn btn-sm" @click="copyText(matches.map(m => m.text).join('\n'))">复制匹配</button>
        </div>
        <div v-if="showGroups && groupRows.length" class="group-table-wrap">
          <h3>捕获分组</h3>
          <table class="group-table">
            <thead>
              <tr><th>匹配序号</th><th>分组</th><th>值</th></tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in groupRows" :key="i">
                <td>{{ row.matchIndex }}</td>
                <td>#{{ row.groupIndex }}{{ row.name ? ` (${row.name})` : '' }}</td>
                <td>{{ row.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="showGroups" class="empty-hint">无捕获分组</div>
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
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.config-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.flag-label {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.preset-select {
  width: 160px;
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
.result-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.replace-result {
  margin-top: 8px;
  padding: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  white-space: pre-wrap;
}
.group-table-wrap {
  margin-top: 12px;
}
.group-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-top: 6px;
}
.group-table th, .group-table td {
  border: 1px solid var(--border);
  padding: 6px 8px;
  text-align: left;
  word-break: break-all;
}
.group-table th {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}
.empty-hint {
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 13px;
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
