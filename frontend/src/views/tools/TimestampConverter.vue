<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import * as tsLogic from '../../logic/timestamp'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const tsInput = ref('')
const dateInput = ref('')
const error = ref('')
const toast = useToast()

function formatLocal(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const tsResult = ref(null)
const dateResult = ref(null)

const {
  autoMode,
  clearAll: baseClear,
  loadExample
} = useTool({
  storageKey: 'ts',
  processor: () => '',
  paramMapping: {
    ts: { ref: tsInput },
    date: { ref: dateInput }
  },
  example: '1700000000'
})

function tsToDate() {
  error.value = ''
  if (!tsInput.value) { tsResult.value = null; return }
  try {
    tsResult.value = tsLogic.toDate(tsInput.value)
  } catch (e) {
    tsResult.value = null
    error.value = e.message
  }
}

function dateToTs() {
  error.value = ''
  if (!dateInput.value) { dateResult.value = null; return }
  try {
    dateResult.value = tsLogic.fromDate(dateInput.value)
  } catch (e) {
    dateResult.value = null
    error.value = e.message
  }
}

watch(tsInput, () => tsToDate())
watch(dateInput, () => dateToTs())

const nowTs = ref(Date.now())
let timer = null
onMounted(() => {
  timer = setInterval(() => { nowTs.value = Date.now() }, 1000)
})
onUnmounted(() => clearInterval(timer))

const nowText = computed(() => {
  const d = new Date(nowTs.value)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})

async function copyVal(v) {
  await navigator.clipboard.writeText(String(v))
  toast.success('已复制')
}

function now() {
  const n = new Date()
  tsInput.value = String(Math.floor(n.getTime() / 1000))
  dateInput.value = formatLocal(n)
  if (autoMode.value) { tsToDate(); dateToTs() }
}

function clearAll() {
  baseClear()
  tsInput.value = ''
  dateInput.value = ''
  tsResult.value = null
  dateResult.value = null
  error.value = ''
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>⏰ 时间戳转换</h1>
      <AiHelpPanel
        title="时间戳转换"
        desc="Unix 时间戳（秒/毫秒）与日期互转"
        :params="[
          { name: 'ts', desc: 'Unix 时间戳（10位秒或13位毫秒）', required: true, example: '1700000000' },
          { name: 'date', desc: '日期字符串（ISO格式）', required: false, example: '2023-11-15T00:00' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="help-text card">
      <strong style="color:var(--text-primary)">使用说明：</strong><br>
      • <strong>时间戳 → 日期</strong>：输入 10 位（秒）或 13 位（毫秒）时间戳，实时转换<br>
      • <strong>日期 → 时间戳</strong>：使用日期选择器选择本地时间，实时转换<br>
      • 点击「现在」按钮可快速填入当前时间
    </div>
    <div class="tool-section">
      <div class="tool-panel card">
        <h3>时间戳 → 日期</h3>
        <input v-model="tsInput" class="input" placeholder="输入 10/13 位时间戳" @keyup.enter="tsToDate">
        <div class="tool-actions">
          <button class="btn" @click="tsToDate">转换</button>
          <button class="btn btn-secondary" @click="now">现在</button>
        </div>
        <div v-if="tsResult" class="result-rows">
          <div class="result-row" v-for="row in [
            { label: '友好格式', value: tsResult.friendly },
            { label: '本地时间', value: tsResult.local },
            { label: 'ISO', value: tsResult.iso },
            { label: '秒级', value: tsResult.unixSeconds },
            { label: '毫秒', value: tsResult.unixMs },
            { label: '相对时间', value: tsResult.relative }
          ]" :key="row.label">
            <span class="row-label">{{ row.label }}</span>
            <code class="row-value">{{ row.value }}</code>
            <button class="btn btn-sm btn-secondary row-copy" @click="copyVal(row.value)">复制</button>
          </div>
        </div>
      </div>
      <div class="tool-panel card">
        <h3>日期 → 时间戳</h3>
        <input v-model="dateInput" class="input" type="datetime-local" @change="dateToTs">
        <div class="tool-actions">
          <button class="btn" @click="dateToTs">转换</button>
        </div>
        <div v-if="dateResult" class="result-rows">
          <div class="result-row" v-for="row in [
            { label: '友好格式', value: dateResult.friendly },
            { label: '本地时间', value: dateResult.local },
            { label: 'ISO', value: dateResult.iso },
            { label: '秒级', value: dateResult.unixSeconds },
            { label: '毫秒', value: dateResult.unixMs }
          ]" :key="row.label">
            <span class="row-label">{{ row.label }}</span>
            <code class="row-value">{{ row.value }}</code>
            <button class="btn btn-sm btn-secondary row-copy" @click="copyVal(row.value)">复制</button>
          </div>
        </div>
      </div>
    </div>
    <div style="margin-bottom:12px">
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>
    <div v-if="error" class="error-msg">❌ {{ error }}</div>
    <div class="tool-actions" style="margin-top:10px">
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">加载示例</button>
      <span style="font-size:12px;color:var(--text-muted)">当前时间：{{ nowText }}</span>
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
.help-text {
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
  padding: 12px 16px;
}
.panel-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.result-rows {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.result-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
}
.row-label {
  flex-shrink: 0;
  min-width: 56px;
  color: var(--text-muted);
}
.row-value {
  flex: 1;
  word-break: break-all;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
}
.row-copy {
  flex-shrink: 0;
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
