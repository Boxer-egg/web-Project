<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { useToast } from '../../composables/useToast'
import { getUrlParams } from '../../utils/urlParams'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const today = new Date().toISOString().slice(0, 10)

const productionDate = useStorage('shelf-production-date', today)
const shelfValue = useStorage('shelf-value', 30)
const shelfUnit = useStorage('shelf-unit', 'day')

const result = ref(null)
const toast = useToast()

const units = [
  { value: 'day', label: '天' },
  { value: 'month', label: '个月' },
  { value: 'year', label: '年' }
]

const stateText = computed(() => {
  if (!result.value) return ''
  return result.value.daysRemaining >= 0
    ? `还有 ${result.value.daysRemaining} 天到期`
    : `已过期 ${Math.abs(result.value.daysRemaining)} 天`
})

const stateClass = computed(() => {
  if (!result.value) return ''
  if (result.value.daysRemaining > 7) return 'state-fresh'
  if (result.value.daysRemaining >= 0) return 'state-warning'
  return 'state-expired'
})

/**
 * Add a duration to a date and return the resulting date.
 * @param {Date} date - Base date.
 * @param {number} value - Duration value.
 * @param {string} unit - Duration unit: 'day' | 'month' | 'year'.
 * @returns {Date}
 */
function addDuration(date, value, unit) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const v = Math.floor(value)
  if (unit === 'day') {
    d.setDate(d.getDate() + v)
  } else if (unit === 'month') {
    d.setMonth(d.getMonth() + v)
  } else if (unit === 'year') {
    d.setFullYear(d.getFullYear() + v)
  }
  return d
}

/**
 * Calculate the difference in whole days between two dates.
 * @param {Date} a - First date.
 * @param {Date} b - Second date.
 * @returns {number}
 */
function diffDays(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((end - start) / msPerDay)
}

function calculate() {
  const start = new Date(productionDate.value)
  if (Number.isNaN(start.getTime())) {
    toast.error('生产日期无效')
    result.value = null
    return
  }

  const value = Number(shelfValue.value)
  if (!Number.isFinite(value) || value <= 0) {
    toast.error('保质期必须为正数')
    result.value = null
    return
  }

  const expiry = addDuration(start, value, shelfUnit.value)
  const now = new Date()
  const daysRemaining = diffDays(now, expiry)

  result.value = {
    expiryDate: expiry.toISOString().slice(0, 10),
    daysRemaining,
    formattedExpiry: expiry.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('date')) productionDate.value = params.get('date')
  if (params.get('value')) shelfValue.value = Number(params.get('value'))
  if (params.get('unit')) shelfUnit.value = params.get('unit')
  if (params.get('auto') === '1') calculate()
})

function copy(text) {
  navigator.clipboard.writeText(text)
  toast.success('已复制')
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🥫 保质期计算</h1>
      <AiHelpPanel
        title="保质期计算"
        desc="根据生产日期和保质期长度，计算过期日期与剩余天数"
        api-tool="shelf_life"
        :params="[
          { name: 'date', desc: '生产日期（YYYY-MM-DD）', required: false, example: '2026-06-01' },
          { name: 'value', desc: '保质期数值', required: false, example: '30' },
          { name: 'unit', desc: '单位：day/month/year', required: false, example: 'day' },
          { name: 'auto', desc: '是否自动计算（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="tool-section">
      <div class="tool-panel card">
        <h3>输入</h3>
        <div class="config-row">
          <label>生产日期</label>
          <input v-model="productionDate" type="date" class="input">
        </div>
        <div class="config-row">
          <label>保质期</label>
          <div class="input-group">
            <input v-model.number="shelfValue" type="number" min="1" class="input" placeholder="例如 30">
            <select v-model="shelfUnit" class="input">
              <option v-for="u in units" :key="u.value" :value="u.value">{{ u.label }}</option>
            </select>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn" @click="calculate">计算</button>
        </div>
      </div>

      <div class="tool-panel card">
        <h3>结果</h3>
        <div v-if="result" class="result-block">
          <div class="result-row">
            <span class="result-label">过期日期</span>
            <div class="result-value-wrap">
              <code class="result-value">{{ result.formattedExpiry }}</code>
              <button class="btn btn-sm btn-secondary" @click="copy(result.expiryDate)">复制</button>
            </div>
          </div>
          <div class="result-row">
            <span class="result-label">状态</span>
            <span class="state-badge" :class="stateClass">{{ stateText }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">ISO 日期</span>
            <code class="result-value">{{ result.expiryDate }}</code>
          </div>
        </div>
        <div v-else class="empty-state">
          输入生产日期和保质期后点击“计算”
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
.config-row {
  margin-bottom: 16px;
}
.config-row label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.input-group {
  display: flex;
  gap: 10px;
}
.input-group .input:first-child {
  flex: 1;
}
.input-group .input:last-child {
  width: 100px;
  flex-shrink: 0;
}
.tool-actions {
  margin-top: 8px;
}
.result-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.result-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.result-label {
  font-size: 13px;
  color: var(--text-secondary);
}
.result-value-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.result-value {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 15px;
  color: var(--text-primary);
  word-break: break-all;
}
.state-badge {
  display: inline-block;
  width: fit-content;
  padding: 6px 12px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
}
.state-fresh {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}
.state-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}
.state-expired {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}
.empty-state {
  color: var(--text-muted);
  padding: 40px;
  text-align: center;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}
</style>
