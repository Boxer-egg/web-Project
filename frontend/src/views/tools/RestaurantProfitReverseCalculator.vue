<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useStorage } from '@vueuse/core'
import {
  resolveMonthlyRent,
  calcFromDailyRevenue,
  calcFromMonthlyNetProfit,
  calcFromDailyCustomers,
} from '../../logic/restaurantProfitReverse.js'
import { getUrlParams, applyParams, toNumber, syncParamsToUrl, buildShareUrl } from '../../utils/urlParams.js'
import { useToast } from '../../composables/useToast.js'

const toast = useToast()

const MODES = [
  { key: 'dailyRevenue', name: '日营业额', unit: '元/天', placeholder: '例如：2000' },
  { key: 'monthlyNetProfit', name: '月净利润', unit: '元/月', placeholder: '例如：8000' },
  { key: 'dailyCustomers', name: '日均客户数', unit: '人/天', placeholder: '例如：80' },
]

const mode = useStorage('rpr-mode', 'dailyRevenue')
const dailyRevenueValue = useStorage('rpr-daily-revenue', 0)
const monthlyNetProfitValue = useStorage('rpr-monthly-net-profit', 0)
const dailyCustomersValue = useStorage('rpr-daily-customers', 0)

/** 当前模式对应的录入值（三模式独立存储） */
const observedValue = computed({
  get() {
    switch (mode.value) {
      case 'monthlyNetProfit':
        return monthlyNetProfitValue.value
      case 'dailyCustomers':
        return dailyCustomersValue.value
      case 'dailyRevenue':
      default:
        return dailyRevenueValue.value
    }
  },
  set(val) {
    switch (mode.value) {
      case 'monthlyNetProfit':
        monthlyNetProfitValue.value = val
        break
      case 'dailyCustomers':
        dailyCustomersValue.value = val
        break
      case 'dailyRevenue':
      default:
        dailyRevenueValue.value = val
    }
  },
})
const avgTicket = useStorage('rpr-avg-ticket', 0)
const grossMargin = useStorage('rpr-gross-margin', 0)
const monthlyRent = useStorage('rpr-monthly-rent', 0)
const yearlyRent = useStorage('rpr-yearly-rent', 0)
const utilityFixedCost = useStorage('rpr-utility-fixed-cost', 0)
const laborFixedCost = useStorage('rpr-labor-fixed-cost', 0)
const seats = useStorage('rpr-seats', 0)
const daysPerMonth = useStorage('rpr-days-per-month', 30)
const businessName = useStorage('rpr-business-name', '')

const selectedMode = computed(() => MODES.find(m => m.key === mode.value) || MODES[0])

const effectiveMonthlyRent = computed(() =>
  resolveMonthlyRent({
    monthlyRent: monthlyRent.value,
    yearlyRent: yearlyRent.value,
  })
)

const effectiveMonthlyFixedCost = computed(() =>
  effectiveMonthlyRent.value
  + (Number(utilityFixedCost.value) || 0)
  + (Number(laborFixedCost.value) || 0)
)

/** 月/年租金联动：改一方时自动换算另一方 */
const isUpdatingRent = ref(false)

watch(monthlyRent, (val) => {
  if (isUpdatingRent.value) return
  isUpdatingRent.value = true
  yearlyRent.value = Number(val || 0) * 12
  nextTick(() => {
    isUpdatingRent.value = false
  })
})

watch(yearlyRent, (val) => {
  if (isUpdatingRent.value) return
  isUpdatingRent.value = true
  monthlyRent.value = Number(val || 0) / 12
  nextTick(() => {
    isUpdatingRent.value = false
  })
})

/** 将输入值限制在最小值以上 */
function clampMin(ref, min = 0) {
  watch(ref, (val) => {
    const n = Number(val)
    if (Number.isFinite(n) && n < min) ref.value = min
  })
}

clampMin(dailyRevenueValue)
clampMin(monthlyNetProfitValue)
clampMin(dailyCustomersValue)
clampMin(avgTicket)
clampMin(monthlyRent)
clampMin(yearlyRent)
clampMin(utilityFixedCost)
clampMin(laborFixedCost)
clampMin(seats)
clampMin(daysPerMonth, 1)

watch(grossMargin, (val) => {
  const n = Number(val)
  if (Number.isFinite(n)) {
    if (n < 0) grossMargin.value = 0
    else if (n > 1) grossMargin.value = 1
  }
})

/** 当前模式对应的录入值引用 */
function getCurrentObservedValueRef() {
  switch (mode.value) {
    case 'monthlyNetProfit':
      return monthlyNetProfitValue
    case 'dailyCustomers':
      return dailyCustomersValue
    case 'dailyRevenue':
    default:
      return dailyRevenueValue
  }
}

/** 关键必填字段校验 */
const MISSING_FIELDS = [
  { key: 'observedValue', label: '调研数据', check: () => !Number(getCurrentObservedValueRef().value) },
  { key: 'avgTicket', label: '平均客单价', check: () => !Number(avgTicket.value) },
  { key: 'grossMargin', label: '毛利率', check: () => !Number(grossMargin.value) },
  { key: 'rent', label: '月租金或年租金', check: () => !Number(monthlyRent.value) && !Number(yearlyRent.value) },
  { key: 'utilityFixedCost', label: '水电杂费', check: () => !Number(utilityFixedCost.value) },
  { key: 'laborFixedCost', label: '人工固定成本', check: () => !Number(laborFixedCost.value) },
]

const missingFields = computed(() =>
  MISSING_FIELDS.filter(f => f.check()).map(f => f.key)
)

const hasMissingFields = computed(() => missingFields.value.length > 0)

const missingFieldLabels = computed(() =>
  MISSING_FIELDS
    .filter(f => missingFields.value.includes(f.key))
    .map(f => f.label)
)

const result = computed(() => {
  const common = {
    avgTicket: avgTicket.value,
    grossMargin: grossMargin.value,
    monthlyFixedCost: effectiveMonthlyFixedCost.value,
    seats: seats.value,
    daysPerMonth: daysPerMonth.value,
  }

  switch (mode.value) {
    case 'monthlyNetProfit':
      return calcFromMonthlyNetProfit({ ...common, monthlyNetProfit: observedValue.value })
    case 'dailyCustomers':
      return calcFromDailyCustomers({ ...common, dailyCustomers: observedValue.value })
    case 'dailyRevenue':
    default:
      return calcFromDailyRevenue({ ...common, dailyRevenue: observedValue.value })
  }
})

function fmtMoney(n) {
  if (n === null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

function fmtNumber(n, digits = 2) {
  if (n === null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

function loadExample() {
  mode.value = 'dailyRevenue'
  dailyRevenueValue.value = 2000
  monthlyNetProfitValue.value = 8000
  dailyCustomersValue.value = 80
  avgTicket.value = 20
  grossMargin.value = 0.6
  monthlyRent.value = 15000
  yearlyRent.value = 0
  utilityFixedCost.value = 2000
  laborFixedCost.value = 8000
  seats.value = 24
  daysPerMonth.value = 30
}

function clearAll() {
  mode.value = 'dailyRevenue'
  dailyRevenueValue.value = 0
  monthlyNetProfitValue.value = 0
  dailyCustomersValue.value = 0
  avgTicket.value = 0
  grossMargin.value = 0
  monthlyRent.value = 0
  yearlyRent.value = 0
  utilityFixedCost.value = 0
  laborFixedCost.value = 0
  seats.value = 0
  daysPerMonth.value = 30
  businessName.value = ''
}

/**
 * URL 分享参数映射。key 为 query 参数名，default 为缺省值（缺省时不写入链接）。
 * 顺序有意义：applyParams 按声明顺序写入，mode 需先于 v（观测值），
 * yrent 需先于 mrent（租金联动 watcher 会让后写的一方生效）。
 */
const shareMapping = {
  mode: { ref: mode, default: 'dailyRevenue' },
  v: { ref: observedValue, default: 0 },
  ticket: { ref: avgTicket, default: 0 },
  gm: { ref: grossMargin, default: 0 },
  yrent: { ref: yearlyRent, default: 0 },
  mrent: { ref: monthlyRent, default: 0 },
  util: { ref: utilityFixedCost, default: 0 },
  labor: { ref: laborFixedCost, default: 0 },
  seats: { ref: seats, default: 0 },
  days: { ref: daysPerMonth, default: 30 },
  name: { ref: businessName, default: '' },
}

/** 打开带参数的分享链接时，把参数回填到表单（优先级高于 localStorage） */
applyParams(getUrlParams(), {
  mode: { ref: mode, allowed: MODES.map(m => m.key) },
  v: { ref: observedValue, transform: toNumber },
  ticket: { ref: avgTicket, transform: toNumber },
  gm: { ref: grossMargin, transform: toNumber },
  yrent: { ref: yearlyRent, transform: toNumber },
  mrent: { ref: monthlyRent, transform: toNumber },
  util: { ref: utilityFixedCost, transform: toNumber },
  labor: { ref: laborFixedCost, transform: toNumber },
  seats: { ref: seats, transform: toNumber },
  days: { ref: daysPerMonth, transform: toNumber },
  name: { ref: businessName },
})

/** 输入变化时把当前参数同步到地址栏，保证复制链接永远是最新的 */
const stopUrlSync = syncParamsToUrl(shareMapping)
onUnmounted(stopUrlSync)

/** 复制包含当前所有参数的分享链接 */
async function copyShareLink() {
  const url = buildShareUrl(shareMapping)
  try {
    await navigator.clipboard.writeText(url)
    toast.success('分享链接已复制，发送给对方即可')
  } catch {
    window.prompt('复制下面的链接分享给他人：', url)
  }
}

function getSiteDomain() {
  try {
    return window.location.hostname || 'vvzzv.com'
  } catch {
    return 'vvzzv.com'
  }
}

function downloadResultsAsImage() {
  const name = window.prompt('请填写商圈名称（可直接留空跳过）', businessName.value)
  if (name !== null) {
    businessName.value = name.trim()
  }

  const width = 480
  const padding = 20
  const labelWidth = 170
  const valueX = padding + labelWidth
  const lineHeight = 26
  const headerHeight = 70
  const sectionGap = 16
  const rows = [
    ['调研模式', selectedMode.value.name],
    ['录入数值', `${fmtMoney(observedValue.value)} ${selectedMode.value.unit}`],
    ['平均客单价', `${fmtMoney(avgTicket.value)} 元`],
    ['毛利率', `${((grossMargin.value || 0) * 100).toFixed(0)}%`],
    ['月租金', `${fmtMoney(effectiveMonthlyRent.value)} 元`],
    ['水电杂费', `${fmtMoney(utilityFixedCost.value)} 元`],
    ['人工固定成本', `${fmtMoney(laborFixedCost.value)} 元`],
    ['总月固定成本', `${fmtMoney(effectiveMonthlyFixedCost.value)} 元`],
    ['座位数', `${seats.value || 0} 个`],
    ['日均单数', `${fmtNumber(result.value.dailyOrders, 1)} 单`],
    ['日营业额', `${fmtMoney(result.value.dailyRevenue)} 元`],
    ['月营业额', `${fmtMoney(result.value.monthlyRevenue)} 元`],
    ['月净利润', `${fmtMoney(result.value.monthlyNetProfit)} 元`],
    ['翻台率', result.value.turnoverRate !== null ? fmtNumber(result.value.turnoverRate, 2) : '—'],
  ]
  const contentHeight = rows.length * lineHeight + sectionGap * 4 + headerHeight
  const height = contentHeight + padding * 2

  const canvas = document.createElement('canvas')
  canvas.width = width * 2
  canvas.height = 1600
  canvas.style.width = `${width}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(2, 2)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, 1600)

  ctx.fillStyle = '#f59e0b'
  ctx.fillRect(0, 0, width, headerHeight)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const headerTitle = businessName.value ? `🍜 ${businessName.value}` : '🍜 餐饮反向调研'
  ctx.fillText(headerTitle, width / 2, headerHeight / 2 - 10)
  ctx.font = '11px sans-serif'
  ctx.fillText(`生成时间：${new Date().toLocaleString('zh-CN')}`, width / 2, headerHeight / 2 + 16)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  let y = headerHeight + sectionGap
  ctx.font = '14px sans-serif'
  ctx.fillStyle = '#374151'

  function drawSectionTitle(title) {
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 15px sans-serif'
    ctx.fillText(title, padding, y)
    y += 24
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(padding, y - 5, width - padding * 2, 1)
    ctx.fillStyle = '#374151'
    ctx.font = '14px sans-serif'
  }

  function drawRow(label, value, options = {}) {
    ctx.fillStyle = '#6b7280'
    ctx.fillText(label, padding, y)
    ctx.fillStyle = options.accent ? '#d97706' : '#111827'
    ctx.font = options.bold ? 'bold 14px sans-serif' : '14px sans-serif'
    ctx.fillText(value, valueX, y)
    ctx.font = '14px sans-serif'
    y += lineHeight
  }

  drawSectionTitle('调研输入')
  for (let i = 0; i < 2; i++) {
    drawRow(rows[i][0], rows[i][1])
  }

  y += sectionGap
  drawSectionTitle('估算参数')
  for (let i = 2; i < 8; i++) {
    drawRow(rows[i][0], rows[i][1])
  }

  y += sectionGap
  drawSectionTitle('反推结果')
  for (let i = 8; i < rows.length; i++) {
    ctx.fillStyle = '#6b7280'
    ctx.fillText(rows[i][0], padding, y)
    const color = i === 12
      ? (result.value.monthlyNetProfit >= 0 ? '#16a34a' : '#dc2626')
      : '#111827'
    ctx.fillStyle = color
    ctx.font = i === 12 ? 'bold 14px sans-serif' : '14px sans-serif'
    ctx.fillText(rows[i][1], valueX, y)
    ctx.font = '14px sans-serif'
    y += lineHeight
  }

  y += sectionGap
  ctx.fillStyle = '#9ca3af'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`由 ${getSiteDomain()} 生成，数据仅供参考`, width / 2, y)
  y += 12

  const finalHeight = y + padding
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = width * 2
  exportCanvas.height = finalHeight * 2
  const ectx = exportCanvas.getContext('2d')
  if (!ectx) return
  ectx.drawImage(canvas, 0, 0, width * 2, finalHeight * 2, 0, 0, width * 2, finalHeight * 2)

  const link = document.createElement('a')
  link.href = exportCanvas.toDataURL('image/png')
  const filenameBase = businessName.value ? businessName.value : '餐饮反向调研'
  link.download = `${filenameBase}-${new Date().toISOString().slice(0, 10)}.png`
  link.click()
}
</script>

<template>
  <div class="tool-page restaurant-profit-reverse">
    <div class="tool-header">
      <h1>🍜 餐饮反向调研</h1>
      <p class="tool-desc">输入调研到的单一数据，反推竞品日均单数、营业额、净利润与翻台率。</p>
    </div>

    <div class="calculator-layout">
      <!-- 左侧输入 -->
      <div id="reverse-input" class="card input-panel">
        <div class="section-title">调研数据（三选一）</div>
        <div class="mode-selector">
          <button
            v-for="m in MODES"
            :key="m.key"
            type="button"
            class="mode-option"
            :class="{ active: mode === m.key }"
            @click="mode = m.key"
          >
            {{ m.name }}
          </button>
        </div>
        <div class="form-row">
          <label>{{ selectedMode.name }}（{{ selectedMode.unit }}）</label>
          <input v-model.lazy.number="observedValue" type="number" min="0" class="input" :placeholder="selectedMode.placeholder">
          <span v-if="missingFields.includes('observedValue')" class="field-warning">请填写{{ selectedMode.name }}，否则无法反推</span>
        </div>

        <div class="section-title">估算参数</div>
        <div class="param-group">
          <div class="form-row form-row-2col">
            <div class="form-col">
              <label>平均客单价（元）</label>
              <input v-model.number="avgTicket" type="number" min="0" class="input" placeholder="例如：20">
              <span v-if="missingFields.includes('avgTicket')" class="field-warning">请填写平均客单价</span>
            </div>
            <div class="form-col">
              <label>毛利率</label>
              <input v-model.number="grossMargin" type="number" step="0.01" min="0" max="1" class="input" placeholder="0.6 表示 60%">
              <span v-if="missingFields.includes('grossMargin')" class="field-warning">请填写毛利率</span>
            </div>
          </div>
        </div>
        <div class="param-group cost-group">
          <div class="form-row form-row-2col">
            <div class="form-col">
              <label>月租金（元）</label>
              <input v-model.number="monthlyRent" type="number" min="0" class="input" placeholder="例如：15000">
            </div>
            <div class="form-col">
              <label>年租金（元）</label>
              <input v-model.number="yearlyRent" type="number" min="0" class="input" placeholder="会自动换算成月租金">
            </div>
          </div>
          <span v-if="missingFields.includes('rent')" class="field-warning">请填写月租金或年租金，用于计算固定成本</span>
          <div class="form-row form-row-2col">
            <div class="form-col">
              <label>水电杂费（元/月）</label>
              <input v-model.number="utilityFixedCost" type="number" min="0" class="input" placeholder="例如：2000">
              <span v-if="missingFields.includes('utilityFixedCost')" class="field-warning">请填写水电杂费</span>
            </div>
            <div class="form-col">
              <label>人工固定成本（元/月）</label>
              <input v-model.number="laborFixedCost" type="number" min="0" class="input" placeholder="例如：8000">
              <span v-if="missingFields.includes('laborFixedCost')" class="field-warning">请填写人工固定成本</span>
            </div>
          </div>
        </div>
        <div class="param-group">
          <div class="form-row form-row-2col">
            <div class="form-col">
              <label>座位数</label>
              <input v-model.number="seats" type="number" min="0" class="input" placeholder="用于算翻台率">
            </div>
            <div class="form-col">
              <label>每月营业天数</label>
              <input v-model.number="daysPerMonth" type="number" min="0" max="31" class="input">
            </div>
          </div>
        </div>
        <div class="form-row">
          <label>商圈名称（选填）</label>
          <input v-model="businessName" type="text" class="input" placeholder="例如：一中店">
        </div>

        <div class="form-actions">
          <button class="btn" @click="loadExample">加载示例</button>
          <button class="btn" @click="copyShareLink">🔗 复制分享链接</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
        </div>
      </div>

      <!-- 右侧结果 -->
      <div class="result-panel">
        <div id="reverse-results" class="card result-card">
          <div class="section-title">反推结果</div>
          <div v-if="hasMissingFields" class="result-warning">
            当前还有 {{ missingFields.length }} 项关键参数未填写，反推结果可能不准确：{{ missingFieldLabels.join('、') }}
          </div>
          <div class="metric-grid">
            <div class="metric highlight">
              <div class="metric-value">{{ fmtNumber(result.dailyOrders, 1) }}</div>
              <div class="metric-label">日均单数（单）</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ fmtMoney(result.dailyRevenue) }}</div>
              <div class="metric-label">日营业额（元）</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ fmtMoney(result.monthlyRevenue) }}</div>
              <div class="metric-label">月营业额（元）</div>
            </div>
            <div class="metric" :class="{ 'text-success': result.monthlyNetProfit > 0, 'text-error': result.monthlyNetProfit < 0 }">
              <div class="metric-value">{{ fmtMoney(result.monthlyNetProfit) }}</div>
              <div class="metric-label">月净利润（元）</div>
            </div>
            <div v-if="result.turnoverRate !== null" class="metric">
              <div class="metric-value">{{ fmtNumber(result.turnoverRate, 2) }}</div>
              <div class="metric-label">翻台率（单/座位）</div>
            </div>
          </div>
        </div>

        <div class="card result-card">
          <div class="section-title">参数回显</div>
          <div class="param-echo-grid">
            <div class="param-item"><span class="param-label">平均客单价</span><span class="param-value">{{ fmtMoney(avgTicket) }} 元</span></div>
            <div class="param-item"><span class="param-label">毛利率</span><span class="param-value">{{ ((grossMargin || 0) * 100).toFixed(0) }}%</span></div>
            <div class="param-item"><span class="param-label">月租金</span><span class="param-value">{{ fmtMoney(effectiveMonthlyRent) }} 元</span></div>
            <div class="param-item"><span class="param-label">水电杂费</span><span class="param-value">{{ fmtMoney(utilityFixedCost) }} 元</span></div>
            <div class="param-item"><span class="param-label">人工固定成本</span><span class="param-value">{{ fmtMoney(laborFixedCost) }} 元</span></div>
            <div class="param-item"><span class="param-label">总月固定成本</span><span class="param-value">{{ fmtMoney(effectiveMonthlyFixedCost) }} 元</span></div>
            <div class="param-item"><span class="param-label">每月营业天数</span><span class="param-value">{{ daysPerMonth }} 天</span></div>
          </div>
        </div>

        <div class="download-bar">
          <button class="btn" @click="downloadResultsAsImage">保存图片</button>
        </div>

        <div class="card result-card">
          <div class="section-title">说明</div>
          <p class="hint-text">反推结果基于你填写的估算参数，仅供调研参考。实际经营数据可能因促销、季节、客单价波动等因素与估算存在偏差。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.restaurant-profit-reverse {
  max-width: 1200px;
}
.tool-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
  margin-bottom: 16px;
}
.calculator-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
}
@media (max-width: 900px) {
  .calculator-layout {
    grid-template-columns: 1fr;
  }
}

.input-panel {
  padding: 20px;
  height: fit-content;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 20px 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.section-title:first-child {
  margin-top: 0;
}
.param-group {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  margin-bottom: 12px;
}
.param-group .form-row:last-child {
  margin-bottom: 0;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.form-row label {
  font-size: 13px;
  color: var(--text-secondary);
}
.form-row.form-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.form-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.input {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
}
.mode-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.mode-option {
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
}
.mode-option.active {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
.download-bar {
  margin-top: 16px;
}

.result-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.result-card {
  padding: 20px;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}
.metric {
  background: var(--bg-secondary);
  border-radius: var(--radius);
  padding: 14px;
  text-align: center;
}
.metric.highlight {
  background: color-mix(in srgb, var(--accent) 10%, var(--bg-secondary));
  border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--border));
}
.metric-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.metric-label {
  font-size: 12px;
  color: var(--text-secondary);
}
.text-success .metric-value {
  color: var(--success);
}
.text-error .metric-value {
  color: var(--error);
}
.param-echo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
}
.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 0;
}
.param-label {
  flex-shrink: 0;
}
.param-value {
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
}
.hint-text {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.hint-text:last-child {
  margin-bottom: 0;
}
.field-warning {
  font-size: 12px;
  color: var(--error);
  line-height: 1.4;
  margin-top: 4px;
}
.result-warning {
  font-size: 13px;
  color: var(--error);
  background: color-mix(in srgb, var(--error) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--error) 20%, var(--border));
  border-radius: var(--radius);
  padding: 10px 12px;
  margin-bottom: 16px;
  line-height: 1.5;
}
</style>
