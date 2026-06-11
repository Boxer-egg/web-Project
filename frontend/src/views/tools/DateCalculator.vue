<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const mode = useStorage('date-mode', 'diff')
const date1 = useStorage('date-date1', '')
const date2 = useStorage('date-date2', '')
const baseDate = useStorage('date-base', '')
const days = useStorage('date-days', '7')

const result = computed(() => {
  if (mode.value === 'diff') {
    if (!date1.value || !date2.value) return null
    const d1 = new Date(date1.value)
    const d2 = new Date(date2.value)
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null
    const diffTime = d2.getTime() - d1.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    let workDays = 0
    const start = new Date(Math.min(d1.getTime(), d2.getTime()))
    const end = new Date(Math.max(d1.getTime(), d2.getTime()))
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day !== 0 && day !== 6) workDays++
    }
    if (diffDays < 0) workDays = -workDays
    return { type: 'diff', days: diffDays, hours: diffHours, minutes: diffMinutes, workDays }
  } else {
    if (!baseDate.value) return null
    const d = new Date(baseDate.value)
    if (isNaN(d.getTime())) return null
    const n = parseInt(days.value)
    if (isNaN(n)) return null
    const target = new Date(d)
    target.setDate(target.getDate() + n)
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][target.getDay()]
    return { type: 'add', target, weekday, n }
  }
})

function formatDate(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getUrlParams() {
  // History mode: read from search
  return new URLSearchParams(window.location.search)
}

function clearAll() {
  date1.value = ''
  date2.value = ''
  baseDate.value = ''
  days.value = '7'
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('mode')) mode.value = params.get('mode')
  if (params.get('date1')) date1.value = params.get('date1')
  if (params.get('date2')) date2.value = params.get('date2')
  if (params.get('base')) baseDate.value = params.get('base')
  if (params.get('days')) days.value = params.get('days')
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>📅 日期计算器</h1>
      <AiHelpPanel
        title="日期计算器"
        desc="计算两个日期间隔天数，或对指定日期进行加减天数"
        :params="[
          { name: 'date1', desc: '第一个日期（YYYY-MM-DD）', required: true, example: '2023-01-01' },
          { name: 'date2', desc: '第二个日期（YYYY-MM-DD）', required: false, example: '2023-12-31' },
          { name: 'mode', desc: '模式：diff（日期间隔）或 add（日期加减）', required: false, example: 'diff' },
          { name: 'days', desc: '加减天数（mode=add时）', required: false, example: '7' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="card" style="margin-bottom: 16px; padding: 12px 16px">
      <div style="display: flex; gap: 12px; flex-wrap: wrap">
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 14px">
          <input type="radio" v-model="mode" value="diff"> 计算日期间隔
        </label>
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 14px">
          <input type="radio" v-model="mode" value="add"> 日期加减
        </label>
      </div>
    </div>
    <div v-if="mode === 'diff'" class="tool-section">
      <div class="tool-panel card">
        <h3>起始日期</h3>
        <input v-model="date1" class="input" type="date">
        <h3 style="margin-top: 12px">结束日期</h3>
        <input v-model="date2" class="input" type="date">
        <div class="tool-actions" style="margin-top: 16px">
          <button class="btn btn-secondary" @click="clearAll">清空</button>
        </div>
      </div>
      <div class="tool-panel">
        <h3>间隔结果</h3>
        <div v-if="result && result.type === 'diff'" class="result-list">
          <div class="result-row">
            <span class="result-label">相差天数</span>
            <span class="result-value" :class="result.days < 0 ? 'past' : 'future'">{{ result.days }} 天</span>
          </div>
          <div class="result-row">
            <span class="result-label">相差小时</span>
            <span class="result-value">{{ result.hours }} 小时</span>
          </div>
          <div class="result-row">
            <span class="result-label">相差分钟</span>
            <span class="result-value">{{ result.minutes }} 分钟</span>
          </div>
          <div class="result-row">
            <span class="result-label">工作日</span>
            <span class="result-value">{{ result.workDays }} 天</span>
          </div>
        </div>
        <div v-else style="color: var(--text-muted); padding: 40px; text-align: center">请选择两个日期</div>
      </div>
    </div>
    <div v-else class="tool-section">
      <div class="tool-panel card">
        <h3>基准日期</h3>
        <input v-model="baseDate" class="input" type="date">
        <h3 style="margin-top: 12px">加减天数</h3>
        <input v-model="days" class="input" type="number" placeholder="正数向后，负数向前">
        <div class="tool-actions" style="margin-top: 16px">
          <button class="btn btn-secondary" @click="clearAll">清空</button>
        </div>
      </div>
      <div class="tool-panel">
        <h3>计算结果</h3>
        <div v-if="result && result.type === 'add'" class="result-list">
          <div class="result-row">
            <span class="result-label">目标日期</span>
            <span class="result-value">{{ formatDate(result.target) }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">星期</span>
            <span class="result-value">星期{{ result.weekday }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">距今天数</span>
            <span class="result-value">{{ Math.ceil((result.target.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) }} 天</span>
          </div>
        </div>
        <div v-else style="color: var(--text-muted); padding: 40px; text-align: center">请选择日期并输入天数</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}
.result-label {
  font-size: 14px;
  color: var(--text-secondary);
}
.result-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}
.result-value.past {
  color: var(--error);
}
.result-value.future {
  color: var(--success);
}
</style>
