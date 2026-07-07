<script setup>
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

/** 商区类型配置 */
const DISTRICT_TYPES = [
  { key: 'school', name: '学校商区', months: 8, note: '寒暑假客流大幅下降，通常按 8 个月有效营业计算' },
  { key: 'community', name: '社区商区', months: 12, note: '全年营业，周末和节假日客流较好' },
  { key: 'office', name: '写字楼商区', months: 12, note: '工作日午餐为主，周末客流较少' },
  { key: 'scenic', name: '景区/季节性商区', months: 6, note: '旺季集中，淡季可歇业或大幅减员' },
  { key: 'custom', name: '自定义', months: 12, note: '手动设置营业月数' },
]

/** 输入项（带本地存储） */
const districtType = useStorage('rpf-district-type', 'custom')
const area = useStorage('rpf-area', 0)
const annualRent = useStorage('rpf-annual-rent', 0)
const deposit = useStorage('rpf-deposit', 0)
const transferFee = useStorage('rpf-transfer-fee', 0)
const franchiseFee = useStorage('rpf-franchise-fee', 0)
const decorationAd = useStorage('rpf-decoration-ad', 0)
const equipment = useStorage('rpf-equipment', 0)
const firstBatchMaterial = useStorage('rpf-first-batch-material', 0)
const monthlyLabor = useStorage('rpf-monthly-labor', 0)
const monthlyUtilities = useStorage('rpf-monthly-utilities', 0)
const grossMargin = useStorage('rpf-gross-margin', 0)
const avgTicket = useStorage('rpf-avg-ticket', 0)
const seats = useStorage('rpf-seats', 0)
const tables = useStorage('rpf-tables', 0)
const customMonths = useStorage('rpf-custom-months', 12)
const targetDailyOrders = useStorage('rpf-target-daily-orders', 0)

/** 移动端折叠状态 */
const inputCollapsed = useStorage('rpf-input-collapsed', false)
const formulaCollapsed = useStorage('rpf-formula-collapsed', true)

const selectedDistrict = computed(() =>
  DISTRICT_TYPES.find(d => d.key === districtType.value) || DISTRICT_TYPES[0]
)

const operatingMonths = computed(() =>
  districtType.value === 'custom' ? Math.max(1, Number(customMonths.value) || 12) : selectedDistrict.value.months
)

/** 实际月房租 = 年房租 / 12 */
const actualMonthlyRent = computed(() => Number(annualRent.value || 0) / 12)

/** 每月有效房租 = 年房租 / 有效营业月数 */
const effectiveMonthlyRent = computed(() => {
  const months = operatingMonths.value || 12
  return Number(annualRent.value || 0) / months
})

/** 建店成本 */
const buildCost = computed(() =>
  Number(deposit.value || 0) +
  Number(transferFee.value || 0) +
  Number(franchiseFee.value || 0) +
  Number(decorationAd.value || 0) +
  Number(equipment.value || 0) +
  Number(firstBatchMaterial.value || 0)
)

/** 月固定成本 */
const monthlyFixedCost = computed(() =>
  effectiveMonthlyRent.value +
  Number(monthlyLabor.value || 0) +
  Number(monthlyUtilities.value || 0)
)

/** 日固定成本（按 30 天/月） */
const dailyFixedCost = computed(() => monthlyFixedCost.value / 30)

/** 日盈亏平衡营业额 */
const dailyBreakEvenRevenue = computed(() => {
  const margin = Number(grossMargin.value) || 0
  return margin > 0 ? dailyFixedCost.value / margin : 0
})

/** 月平衡营业额 */
const monthlyBreakEvenRevenue = computed(() => dailyBreakEvenRevenue.value * 30)

/** 保本需要单数（日） */
const dailyBreakEvenOrders = computed(() => {
  const ticket = Number(avgTicket.value) || 0
  return ticket > 0 ? dailyBreakEvenRevenue.value / ticket : 0
})

/** 翻台率 = 日单数 / 座位数 */
const turnoverRate = computed(() => {
  const s = Number(seats.value) || 1
  return dailyBreakEvenOrders.value / s
})

/** 目标日订单对应的日营收和月营收 */
const targetDailyRevenue = computed(() => targetDailyOrders.value * (Number(avgTicket.value) || 0))
const targetMonthlyRevenue = computed(() => targetDailyRevenue.value * 30)
const targetMonthlyGrossProfit = computed(() => targetMonthlyRevenue.value * (Number(grossMargin.value) || 0))
const targetMonthlyNetProfit = computed(() => targetMonthlyGrossProfit.value - monthlyFixedCost.value)

/** 回本周期（月）= 建店成本 / 目标月净利润 */
const paybackMonths = computed(() => {
  const profit = targetMonthlyNetProfit.value
  return profit > 0 ? buildCost.value / profit : Infinity
})

function fmtMoney(n) {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

function fmtNumber(n, digits = 2) {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

function fmtPercent(n) {
  if (!Number.isFinite(n)) return '—'
  return (n * 100).toFixed(1) + '%'
}

/** 加载表格示例数据 */
function loadExample() {
  districtType.value = 'school'
  area.value = 140
  annualRent.value = 50000
  deposit.value = 75000
  transferFee.value = 30000
  franchiseFee.value = 0
  decorationAd.value = 15000
  equipment.value = 3000
  firstBatchMaterial.value = 5000
  monthlyLabor.value = 5400
  monthlyUtilities.value = 1500
  grossMargin.value = 0.5
  avgTicket.value = 17
  seats.value = 24
  tables.value = 9
  customMonths.value = 8
  targetDailyOrders.value = 80
}

/** 清空所有输入 */
function clearAll() {
  districtType.value = 'custom'
  area.value = 0
  annualRent.value = 0
  deposit.value = 0
  transferFee.value = 0
  franchiseFee.value = 0
  decorationAd.value = 0
  equipment.value = 0
  firstBatchMaterial.value = 0
  monthlyLabor.value = 0
  monthlyUtilities.value = 0
  grossMargin.value = 0
  avgTicket.value = 0
  seats.value = 0
  tables.value = 0
  customMonths.value = 12
  targetDailyOrders.value = 0
}

/** 下载测算结果图片 */
function downloadResultsAsImage() {
  const width = 640
  const padding = 24
  const lineHeight = 28
  const headerHeight = 80
  const sectionGap = 20
  const rows = [
    ['商区类型', selectedDistrict.value.name],
    ['有效营业月数', `${operatingMonths.value} 个月`],
    ['面积', `${area.value || 0} 平`],
    ['座位数 / 桌数', `${seats.value || 0} / ${tables.value || 0}`],
    ['平均客单价', `${avgTicket.value || 0} 元`],
    ['毛利率', `${((grossMargin.value || 0) * 100).toFixed(0)}%`],
    ['年房租', `${fmtMoney(annualRent)} 元`],
    ['建店成本', `${fmtMoney(buildCost)} 元`],
    ['每月有效房租', `${fmtMoney(effectiveMonthlyRent)} 元（实际 ${fmtMoney(actualMonthlyRent)}）`],
    ['月固定成本', `${fmtMoney(monthlyFixedCost)} 元`],
    ['日固定成本', `${fmtMoney(dailyFixedCost)} 元`],
    ['日盈亏平衡营业额', `${fmtMoney(dailyBreakEvenRevenue)} 元`],
    ['月平衡营业额', `${fmtMoney(monthlyBreakEvenRevenue)} 元`],
    ['保本日单数', `${fmtNumber(dailyBreakEvenOrders, 1)} 单`],
    ['翻台率', `${fmtNumber(turnoverRate, 2)}`],
    ['目标日单数', `${targetDailyOrders.value || 0} 单`],
    ['目标月净利润', `${fmtMoney(targetMonthlyNetProfit)} 元`],
    ['回本周期', paybackMonths.value === Infinity ? '无法回本' : `${fmtNumber(paybackMonths, 1)} 个月`],
  ]
  const contentHeight = rows.length * lineHeight + sectionGap * 4 + headerHeight
  const height = contentHeight + padding * 2

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Header
  ctx.fillStyle = '#f59e0b'
  ctx.fillRect(0, 0, width, headerHeight)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🍜 餐饮盈利测算', width / 2, headerHeight / 2 - 8)
  ctx.font = '12px sans-serif'
  ctx.fillText(`生成时间：${new Date().toLocaleString('zh-CN')}`, width / 2, headerHeight / 2 + 18)

  // Content
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  let y = headerHeight + sectionGap
  ctx.font = '14px sans-serif'
  ctx.fillStyle = '#374151'

  function drawSectionTitle(title) {
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 15px sans-serif'
    ctx.fillText(title, padding, y)
    y += 26
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(padding, y - 6, width - padding * 2, 1)
    ctx.fillStyle = '#374151'
    ctx.font = '14px sans-serif'
  }

  drawSectionTitle('基础信息')
  for (let i = 0; i < 6; i++) {
    const [label, value] = rows[i]
    ctx.fillStyle = '#6b7280'
    ctx.fillText(label, padding, y)
    ctx.fillStyle = '#111827'
    ctx.textAlign = 'right'
    ctx.fillText(value, width - padding, y)
    ctx.textAlign = 'left'
    y += lineHeight
  }

  y += sectionGap
  drawSectionTitle('成本与盈亏')
  for (let i = 6; i < 15; i++) {
    const [label, value] = rows[i]
    ctx.fillStyle = '#6b7280'
    ctx.fillText(label, padding, y)
    ctx.fillStyle = i === 12 ? '#d97706' : '#111827'
    ctx.textAlign = 'right'
    ctx.fillText(value, width - padding, y)
    ctx.textAlign = 'left'
    y += lineHeight
  }

  y += sectionGap
  drawSectionTitle('目标经营')
  for (let i = 15; i < rows.length; i++) {
    const [label, value] = rows[i]
    ctx.fillStyle = '#6b7280'
    ctx.fillText(label, padding, y)
    ctx.fillStyle = i === 16 ? (targetMonthlyNetProfit.value >= 0 ? '#16a34a' : '#dc2626') : '#111827'
    ctx.textAlign = 'right'
    ctx.fillText(value, width - padding, y)
    ctx.textAlign = 'left'
    y += lineHeight
  }

  // Footer
  y += sectionGap
  ctx.fillStyle = '#9ca3af'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('由 在线工具箱 生成，数据仅供参考', width / 2, y)

  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = `餐饮盈利测算-${new Date().toISOString().slice(0, 10)}.png`
  link.click()
}
</script>

<template>
  <div class="tool-page restaurant-profit">
    <div class="tool-header">
      <h1>🍜 餐饮盈利计算器</h1>
      <p class="tool-desc">输入开店成本和经营参数，自动计算盈亏平衡点、保本单数、翻台率和回本周期。</p>
    </div>

    <div class="mobile-toggle-bar">
      <button class="btn btn-sm" @click="inputCollapsed = !inputCollapsed">
        {{ inputCollapsed ? '展开输入面板' : '折叠输入面板' }}
      </button>
    </div>

    <div class="calculator-layout">
      <!-- 左侧输入 -->
      <div v-show="!inputCollapsed" class="card input-panel">
        <div class="section-title">基础信息</div>
        <div class="form-row district-row">
          <label>商区类型</label>
          <div class="district-inputs">
            <select v-model="districtType" class="select district-select">
              <option v-for="d in DISTRICT_TYPES" :key="d.key" :value="d.key">{{ d.key === 'custom' ? d.name : `${d.name}（${d.months}个月）` }}</option>
            </select>
            <input v-if="districtType === 'custom'" v-model.number="customMonths" type="number" min="1" max="12" class="input input-months">
            <span v-if="districtType === 'custom'" class="input-unit">个月</span>
          </div>
        </div>

        <div class="form-row">
          <label>面积（平）</label>
          <input v-model.number="area" type="number" class="input">
        </div>

        <div class="section-title">开店成本</div>
        <div class="form-row">
          <label>年房租（元）</label>
          <input v-model.number="annualRent" type="number" class="input">
        </div>
        <div class="form-row">
          <label>押金（元）</label>
          <input v-model.number="deposit" type="number" class="input">
        </div>
        <div class="form-row">
          <label>转让费/中介费（元）</label>
          <input v-model.number="transferFee" type="number" class="input">
        </div>
        <div class="form-row">
          <label>加盟/技术学习费（元）</label>
          <input v-model.number="franchiseFee" type="number" class="input">
        </div>
        <div class="form-row">
          <label>装修+广告（元）</label>
          <input v-model.number="decorationAd" type="number" class="input">
        </div>
        <div class="form-row">
          <label>设备（元）</label>
          <input v-model.number="equipment" type="number" class="input">
        </div>
        <div class="form-row">
          <label>首批物料（元）</label>
          <input v-model.number="firstBatchMaterial" type="number" class="input">
        </div>

        <div class="section-title">经营成本</div>
        <div class="form-row">
          <label>每月人工（元）</label>
          <input v-model.number="monthlyLabor" type="number" class="input">
        </div>
        <div class="form-row">
          <label>水/电/杂费（元/月）</label>
          <input v-model.number="monthlyUtilities" type="number" class="input">
        </div>
        <div class="form-row">
          <label>毛利率</label>
          <input v-model.number="grossMargin" type="number" step="0.01" min="0" max="1" class="input">
        </div>

        <div class="section-title">营业参数</div>
        <div class="form-row">
          <label>平均客单价（元）</label>
          <input v-model.number="avgTicket" type="number" class="input">
        </div>
        <div class="form-row">
          <label>座位数</label>
          <input v-model.number="seats" type="number" class="input">
        </div>
        <div class="form-row">
          <label>桌数</label>
          <input v-model.number="tables" type="number" class="input">
        </div>
        <div class="form-row">
          <label>目标日单数</label>
          <input v-model.number="targetDailyOrders" type="number" class="input">
        </div>

        <div class="form-actions">
          <button class="btn" @click="loadExample">加载表格示例</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
        </div>
      </div>

      <!-- 右侧结果 -->
      <div class="result-panel">
        <div class="card result-card">
          <div class="section-title">核心结果</div>
          <div class="metric-grid">
            <div class="metric">
              <div class="metric-value">{{ fmtMoney(buildCost) }}</div>
              <div class="metric-label">建店成本（元）</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ fmtMoney(effectiveMonthlyRent) }}</div>
              <div class="metric-label">每月有效房租（实际 {{ fmtMoney(actualMonthlyRent) }}）</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ fmtMoney(monthlyFixedCost) }}</div>
              <div class="metric-label">月固定成本（元）</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ fmtMoney(dailyFixedCost) }}</div>
              <div class="metric-label">日固定成本（元）</div>
            </div>
            <div class="metric highlight">
              <div class="metric-value">{{ fmtMoney(dailyBreakEvenRevenue) }}</div>
              <div class="metric-label">日盈亏平衡营业额（元）</div>
            </div>
            <div class="metric highlight">
              <div class="metric-value">{{ fmtMoney(monthlyBreakEvenRevenue) }}</div>
              <div class="metric-label">月平衡营业额（元）</div>
            </div>
            <div class="metric highlight">
              <div class="metric-value">{{ fmtNumber(dailyBreakEvenOrders, 1) }}</div>
              <div class="metric-label">保本日单数（单）</div>
            </div>
            <div class="metric highlight">
              <div class="metric-value">{{ fmtNumber(turnoverRate, 2) }}</div>
              <div class="metric-label">翻台率（单/座位）</div>
            </div>
          </div>
        </div>

        <div class="card result-card">
          <div class="section-title">目标经营测算（日单数 {{ targetDailyOrders }} 单）</div>
          <div class="metric-grid">
            <div class="metric">
              <div class="metric-value">{{ fmtMoney(targetDailyRevenue) }}</div>
              <div class="metric-label">目标日营收（元）</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ fmtMoney(targetMonthlyRevenue) }}</div>
              <div class="metric-label">目标月营收（元）</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ fmtMoney(targetMonthlyGrossProfit) }}</div>
              <div class="metric-label">目标月毛利（元）</div>
            </div>
            <div class="metric" :class="{ 'text-success': targetMonthlyNetProfit > 0, 'text-error': targetMonthlyNetProfit < 0 }">
              <div class="metric-value">{{ fmtMoney(targetMonthlyNetProfit) }}</div>
              <div class="metric-label">目标月净利润（元）</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ paybackMonths === Infinity ? '无法回本' : fmtNumber(paybackMonths, 1) }}</div>
              <div class="metric-label">回本周期（月）</div>
            </div>
          </div>
        </div>

        <div class="card result-card">
          <div class="section-title formula-title" @click="formulaCollapsed = !formulaCollapsed">
            公式说明
            <span class="toggle-icon">{{ formulaCollapsed ? '▶' : '▼' }}</span>
          </div>
          <div v-show="!formulaCollapsed">
            <ul class="formula-list">
              <li><strong>每月有效房租</strong> = 年房租 ÷ 有效营业月数</li>
              <li><strong>建店成本</strong> = 押金 + 转让费 + 加盟费 + 装修广告 + 设备 + 首批物料</li>
              <li><strong>月固定成本</strong> = 每月有效房租 + 人工 + 水电杂费</li>
              <li><strong>日固定成本</strong> = 月固定成本 ÷ 30</li>
              <li><strong>日盈亏平衡营业额</strong> = 日固定成本 ÷ 毛利率</li>
              <li><strong>保本日单数</strong> = 日盈亏平衡营业额 ÷ 平均客单价</li>
              <li><strong>翻台率</strong> = 保本日单数 ÷ 座位数</li>
              <li><strong>回本周期</strong> = 建店成本 ÷ 目标月净利润</li>
            </ul>
          </div>
          <div style="margin-top: 16px">
            <button class="btn" @click="downloadResultsAsImage">下载测算结果图片</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-toggle-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.formula-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
.toggle-icon {
  font-size: 12px;
  color: var(--text-secondary);
}

.restaurant-profit {
  max-width: 1200px;
}
.tool-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
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
.district-row {
  margin-bottom: 6px;
}
.district-inputs {
  display: flex;
  gap: 10px;
  align-items: center;
}
.district-select {
  flex: 1;
}
.input-months {
  width: 70px;
  flex-shrink: 0;
}
.input-unit {
  font-size: 13px;
  color: var(--text-secondary);
}
.district-note {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0 0 10px;
  line-height: 1.5;
}
.input,
.select {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
}
.district-note {
  font-size: 12px;
  color: var(--text-muted);
  margin: -6px 0 10px;
  line-height: 1.5;
}
.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
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
.formula-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-secondary);
}
.formula-list strong {
  color: var(--text-primary);
}
</style>
