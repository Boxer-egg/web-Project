<script setup>
import { ref } from 'vue'
import * as dateLogic from '../../logic/date'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const date1 = ref('2026-06-11')
const date2 = ref('2026-07-11')
const diffResult = ref(null)
const error = ref('')

function calculate() {
  try {
    diffResult.value = dateLogic.diffDates(date1.value, date2.value)
    error.value = ''
  } catch (e) {
    error.value = e.message
    diffResult.value = null
  }
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>📅 日期计算器</h1>
      <AiHelpPanel
        title="日期计算器"
        desc="计算两个日期之间的天数差"
        :params="[
          { name: 'date1', desc: '起始日期', required: true, example: '2026-06-11' },
          { name: 'date2', desc: '结束日期', required: true, example: '2026-07-11' }
        ]"
      />
    </div>
    <div class="tool-section">
      <div class="tool-panel card">
        <div class="config-row">
          <label>起始日期</label>
          <input v-model="date1" type="date" class="input">
        </div>
        <div class="config-row">
          <label>结束日期</label>
          <input v-model="date2" type="date" class="input">
        </div>
        <button class="btn" @click="calculate">计算差值</button>
      </div>
      <div class="tool-panel">
        <div v-if="diffResult !== null" class="result-card">
          <div class="result-value">{{ diffResult }} 天</div>
        </div>
        <div v-if="error" class="error-msg">❌ {{ error }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-row { margin-bottom: 16px; }
.config-row label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.result-card { background: var(--bg-secondary); padding: 20px; border-radius: var(--radius); text-align: center; }
.result-value { font-size: 32px; font-weight: 600; color: var(--accent); }
.error-msg { color: var(--error); padding: 10px; }
</style>
