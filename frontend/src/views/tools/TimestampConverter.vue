<script setup>
import { ref } from 'vue'
import { useTool } from '../../composables/useTool'
import * as tsLogic from '../../logic/timestamp'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const tsInput = ref('')
const dateInput = ref('')

function formatLocal(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const {
  output,
  autoMode,
  copyText,
  clearAll: baseClear,
  loadExample,
  process: convert,
  copy
} = useTool({
  storageKey: 'ts',
  processor: (val) => {
    // Determine which input triggered the change
    if (tsInput.value && val === tsInput.value) {
      const res = tsLogic.toDate(val)
      return `ISO: ${res.iso}\n本地: ${res.local}\n秒级: ${res.unixSeconds}\n毫秒: ${res.unixMs}\n\n距离现在: ${res.relative}`
    } else if (dateInput.value && val === dateInput.value) {
      const res = tsLogic.fromDate(val)
      return `秒级: ${res.unixSeconds}\n毫秒级: ${res.unixMs}\n\nISO: ${res.iso}\n本地: ${res.local}`
    }
    return ''
  },
  paramMapping: { 
    ts: { ref: tsInput },
    date: { ref: dateInput }
  },
  example: '1700000000'
})

function tsToDate() {
  if (!tsInput.value) return
  try {
    const res = tsLogic.toDate(tsInput.value)
    output.value = `ISO: ${res.iso}\n本地: ${res.local}\n秒级: ${res.unixSeconds}\n毫秒: ${res.unixMs}\n\n距离现在: ${res.relative}`
  } catch (e) {
    output.value = e.message
  }
}

function dateToTs() {
  if (!dateInput.value) return
  try {
    const res = tsLogic.fromDate(dateInput.value)
    output.value = `秒级: ${res.unixSeconds}\n毫秒级: ${res.unixMs}\n\nISO: ${res.iso}\n本地: ${res.local}`
  } catch (e) {
    output.value = e.message
  }
}

function now() {
  const n = new Date()
  tsInput.value = String(Math.floor(n.getTime() / 1000))
  dateInput.value = formatLocal(n)
  if (autoMode.value) tsToDate()
}

function clearAll() {
  baseClear()
  tsInput.value = ''
  dateInput.value = ''
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
      • <strong>时间戳 → 日期</strong>：输入 10 位（秒）或 13 位（毫秒）时间戳<br>
      • <strong>日期 → 时间戳</strong>：使用日期选择器选择本地时间<br>
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
      </div>
      <div class="tool-panel card">
        <h3>日期 → 时间戳</h3>
        <input v-model="dateInput" class="input" type="datetime-local" @change="autoMode && dateToTs()">
        <div class="tool-actions">
          <button class="btn" @click="dateToTs">转换</button>
        </div>
      </div>
    </div>
    <div style="margin-bottom:12px">
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="panel-label">
        <h3 style="font-size:14px">结果</h3>
        <button class="btn btn-sm btn-secondary" @click="copy">{{ copyText }}</button>
      </div>
      <textarea v-model="output" class="textarea" placeholder="转换结果..." rows="8" readonly></textarea>
    </div>
    <div class="tool-actions" style="margin-top:10px">
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">加载示例</button>
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
</style>
