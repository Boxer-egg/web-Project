<script setup>
import { ref, computed, nextTick, watch } from 'vue'
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
const laborAvgSalary = useStorage('rpf-labor-avg-salary', 0)
const laborHeadcount = useStorage('rpf-labor-headcount', 0)
const monthlyUtilities = useStorage('rpf-monthly-utilities', 0)
const grossMargin = useStorage('rpf-gross-margin', 0)
const avgTicket = useStorage('rpf-avg-ticket', 0)
const seats = useStorage('rpf-seats', 0)
const tables = useStorage('rpf-tables', 0)
const customMonths = useStorage('rpf-custom-months', 12)
const targetDailyOrders = useStorage('rpf-target-daily-orders', 0)
const businessName = useStorage('rpf-business-name', '')
const rentPaymentMode = useStorage('rpf-rent-payment-mode', 'year')

/** 移动端折叠状态 */
const inputCollapsed = useStorage('rpf-input-collapsed', false)

/** 每月人工 = 平均工资 × 人数 */
const monthlyLabor = computed(() => Number(laborAvgSalary.value || 0) * Number(laborHeadcount.value || 0))

/** 撤消/重做状态 */
const history = ref([])
const historyIndex = ref(-1)
const isUndoing = ref(false)

const snapshotableRefs = {
  districtType,
  area,
  annualRent,
  deposit,
  transferFee,
  franchiseFee,
  decorationAd,
  equipment,
  firstBatchMaterial,
  laborAvgSalary,
  laborHeadcount,
  monthlyUtilities,
  grossMargin,
  avgTicket,
  seats,
  tables,
  customMonths,
  targetDailyOrders,
  businessName,
  rentPaymentMode,
}

function getSnapshot() {
  const snapshot = {}
  for (const [key, r] of Object.entries(snapshotableRefs)) {
    snapshot[key] = r.value
  }
  return snapshot
}

function applySnapshot(snapshot) {
  isUndoing.value = true
  for (const [key, value] of Object.entries(snapshot)) {
    if (snapshotableRefs[key]) {
      snapshotableRefs[key].value = value
    }
  }
  nextTick(() => {
    isUndoing.value = false
  })
}

function pushHistory() {
  if (isUndoing.value) return
  const snapshot = getSnapshot()
  // 如果和当前状态一致，不重复入栈
  if (historyIndex.value >= 0) {
    const current = history.value[historyIndex.value]
    if (JSON.stringify(current) === JSON.stringify(snapshot)) return
  }
  // 撤销到中间状态后，丢弃后面的历史
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  history.value.push(snapshot)
  historyIndex.value = history.value.length - 1
  // 限制历史长度
  if (history.value.length > 50) {
    history.value.shift()
    historyIndex.value--
  }
}

function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--
    applySnapshot(history.value[historyIndex.value])
  }
}

function redo() {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++
    applySnapshot(history.value[historyIndex.value])
  }
}

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// 监听输入变化，自动保存历史
watch(
  () => getSnapshot(),
  () => pushHistory(),
  { deep: true, flush: 'post' }
)

// 初始化历史
history.value.push(getSnapshot())
historyIndex.value = 0

/** 明细弹窗状态 */
const detailPopup = ref({
  visible: false,
  title: '',
  rows: [],
})

function showDetailPopup(title, rows) {
  detailPopup.value = { visible: true, title, rows }
}

function closeDetailPopup() {
  detailPopup.value.visible = false
}

/** 带明细的字段配置 */
const detailFields = computed(() => ({
  buildCost: {
    title: '建店成本明细',
    rows: [
      ['押金', fmtMoney(deposit.value), '元'],
      ['转让费/中介费', fmtMoney(transferFee.value), '元'],
      ['加盟/技术学习费', fmtMoney(franchiseFee.value), '元'],
      ['装修+广告', fmtMoney(decorationAd.value), '元'],
      ['设备', fmtMoney(equipment.value), '元'],
      ['首批物料', fmtMoney(firstBatchMaterial.value), '元'],
      ['合计', fmtMoney(buildCost.value), '元'],
    ],
  },
  monthlyFixedCost: {
    title: '月固定成本明细',
    rows: [
      ['每月有效房租', fmtMoney(effectiveMonthlyRent.value), '元'],
      ['每月人工', fmtMoney(monthlyLabor.value), '元'],
      ['水/电/杂费', fmtMoney(monthlyUtilities.value), '元'],
      ['合计', fmtMoney(monthlyFixedCost.value), '元'],
    ],
  },
  dailyFixedCost: {
    title: '日固定成本明细',
    rows: [
      ['月固定成本', fmtMoney(monthlyFixedCost.value), '元'],
      ['÷ 30 天', '', ''],
      ['日固定成本', fmtMoney(dailyFixedCost.value), '元'],
    ],
  },
  dailyBreakEvenRevenue: {
    title: '日盈亏平衡营业额明细',
    rows: [
      ['日固定成本', fmtMoney(dailyFixedCost.value), '元'],
      ['÷ 毛利率', fmtPercent(grossMargin.value), ''],
      ['日盈亏平衡营业额', fmtMoney(dailyBreakEvenRevenue.value), '元'],
    ],
  },
  dailyBreakEvenOrders: {
    title: '保本日单数明细',
    rows: [
      ['日盈亏平衡营业额', fmtMoney(dailyBreakEvenRevenue.value), '元'],
      ['÷ 平均客单价', fmtMoney(avgTicket.value), '元'],
      ['保本日单数', fmtNumber(dailyBreakEvenOrders.value, 1), '单'],
    ],
  },
  turnoverRate: {
    title: '翻台率明细',
    rows: [
      ['保本日单数', fmtNumber(dailyBreakEvenOrders.value, 1), '单'],
      ['÷ 座位数', fmtNumber(seats.value, 0), '个'],
      ['翻台率', fmtNumber(turnoverRate.value, 2), ''],
    ],
  },
  targetMonthlyNetProfit: {
    title: '目标月净利润明细',
    rows: [
      ['目标日单数', fmtNumber(targetDailyOrders.value, 0), '单'],
      ['× 平均客单价', fmtMoney(avgTicket.value), '元'],
      ['= 目标日营收', fmtMoney(targetDailyRevenue.value), '元'],
      ['× 30 天', '30', '天'],
      ['= 目标月营收', fmtMoney(targetMonthlyRevenue.value), '元'],
      ['× 毛利率', fmtPercent(grossMargin.value), ''],
      ['= 目标月毛利', fmtMoney(targetMonthlyGrossProfit.value), '元'],
      ['- 月固定成本', fmtMoney(monthlyFixedCost.value), '元'],
      ['= 目标月净利润', fmtMoney(targetMonthlyNetProfit.value), '元'],
    ],
  },
  paybackMonths: {
    title: '回本周期明细',
    rows: [
      ['建店成本', fmtMoney(buildCost.value), '元'],
      ['÷ 目标月净利润', fmtMoney(targetMonthlyNetProfit.value), '元'],
      ['回本周期', paybackMonths.value === Infinity ? '无法回本' : fmtNumber(paybackMonths.value, 1), '个月'],
    ],
  },
}))

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

/** 房租每次支付金额 */
const rentPaymentAmount = computed(() => {
  const rent = Number(annualRent.value || 0)
  if (!rent) return 0
  switch (rentPaymentMode.value) {
    case 'half': return rent / 2
    case 'quarter': return rent / 4
    case 'twoMonth': return rent / 6
    case 'month': return rent / 12
    case 'year':
    default: return rent
  }
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

/** 关键必填字段校验 */
const REQUIRED_FIELDS = [
  { key: 'grossMargin', label: '毛利率' },
  { key: 'avgTicket', label: '平均客单价' },
  { key: 'targetDailyOrders', label: '目标日单数' },
  { key: 'annualRent', label: '年房租' },
  { key: 'laborAvgSalary', label: '平均工资' },
  { key: 'seats', label: '座位数' },
]

/** 返回未填写的关键字段 key 列表 */
const missingRequiredFields = computed(() => {
  const missing = []
  for (const field of REQUIRED_FIELDS) {
    const value = snapshotableRefs[field.key]?.value
    if (!Number(value)) missing.push(field.key)
  }
  return missing
})

const hasMissingRequiredFields = computed(() => missingRequiredFields.value.length > 0)

/** 未填写字段的友好标签 */
const missingRequiredLabels = computed(() =>
  REQUIRED_FIELDS
    .filter(f => missingRequiredFields.value.includes(f.key))
    .map(f => f.label)
)

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
  laborAvgSalary.value = 2700
  laborHeadcount.value = 2
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
  laborAvgSalary.value = 0
  laborHeadcount.value = 0
  monthlyUtilities.value = 0
  grossMargin.value = 0
  avgTicket.value = 0
  seats.value = 0
  tables.value = 0
  customMonths.value = 12
  targetDailyOrders.value = 0
  businessName.value = ''
  rentPaymentMode.value = 'year'
}

/** 找到元素所在的实际滚动容器 */
function getScrollContainer(el) {
  let node = el.parentElement
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node)
    const overflow = style.overflowY
    if ((overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay') && node.scrollHeight > node.clientHeight) {
      return node
    }
    node = node.parentElement
  }
  return document.scrollingElement || document.documentElement
}

/** 平滑滚动到指定区块，点击“录入数据”时自动展开输入面板 */
function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return

  const doScroll = () => {
    const container = getScrollContainer(el)
    const offset = 52
    let top
    if (container === document.documentElement || container === document.body || container === document.scrollingElement) {
      top = el.getBoundingClientRect().top + window.scrollY - offset
    } else {
      const cRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      top = container.scrollTop + elRect.top - cRect.top - offset
    }
    container.scrollTop = top
  }

  if (id === 'profit-input' && inputCollapsed.value) {
    inputCollapsed.value = false
    nextTick(doScroll)
  } else {
    doScroll()
  }
}

function getSiteDomain() {
  try {
    return window.location.hostname || 'vvzzv.com'
  } catch {
    return 'vvzzv.com'
  }
}

/** 下载测算结果图片 */
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
    ['商区类型', selectedDistrict.value.name],
    ['有效营业月数', `${operatingMonths.value} 个月`],
    ['面积', `${area.value || 0} 平`],
    ['座位数 / 桌数', `${seats.value || 0} / ${tables.value || 0}`],
    ['平均客单价', `${avgTicket.value || 0} 元`],
    ['毛利率', `${((grossMargin.value || 0) * 100).toFixed(0)}%`],
    ['年房租', `${fmtMoney(annualRent.value)} 元`],
    ['建店成本', `${fmtMoney(buildCost.value)} 元`],
    ['每月有效房租', `${fmtMoney(effectiveMonthlyRent.value)} 元（实际 ${fmtMoney(actualMonthlyRent.value)}）`],
    ['月固定成本', `${fmtMoney(monthlyFixedCost.value)} 元`],
    ['日固定成本', `${fmtMoney(dailyFixedCost.value)} 元`],
    ['日盈亏平衡营业额', `${fmtMoney(dailyBreakEvenRevenue.value)} 元`],
    ['月平衡营业额', `${fmtMoney(monthlyBreakEvenRevenue.value)} 元`],
    ['保本日单数', `${fmtNumber(dailyBreakEvenOrders.value, 1)} 单`],
    ['翻台率', `${fmtNumber(turnoverRate.value, 2)}`],
    ['目标日单数', `${targetDailyOrders.value || 0} 单`],
    ['目标月净利润', `${fmtMoney(targetMonthlyNetProfit.value)} 元`],
    ['回本周期', paybackMonths.value === Infinity ? '无法回本' : `${fmtNumber(paybackMonths.value, 1)} 个月`],
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

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, 1600)

  // Header
  ctx.fillStyle = '#f59e0b'
  ctx.fillRect(0, 0, width, headerHeight)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const headerTitle = businessName.value ? `🍜 ${businessName.value}` : '🍜 餐饮盈利测算'
  ctx.fillText(headerTitle, width / 2, headerHeight / 2 - 10)
  ctx.font = '11px sans-serif'
  ctx.fillText(`生成时间：${new Date().toLocaleString('zh-CN')}`, width / 2, headerHeight / 2 + 16)

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

  drawSectionTitle('基础信息')
  for (let i = 0; i < 6; i++) {
    drawRow(rows[i][0], rows[i][1])
  }

  y += sectionGap
  drawSectionTitle('成本与盈亏')
  for (let i = 6; i < 15; i++) {
    drawRow(rows[i][0], rows[i][1], { accent: i === 12, bold: i === 12 })
  }

  y += sectionGap
  drawSectionTitle('目标经营')
  for (let i = 15; i < rows.length; i++) {
    ctx.fillStyle = '#6b7280'
    ctx.fillText(rows[i][0], padding, y)
    const color = i === 16
      ? (targetMonthlyNetProfit.value >= 0 ? '#16a34a' : '#dc2626')
      : '#111827'
    ctx.fillStyle = color
    ctx.font = i === 16 ? 'bold 14px sans-serif' : '14px sans-serif'
    ctx.fillText(rows[i][1], valueX, y)
    ctx.font = '14px sans-serif'
    y += lineHeight
  }

  // Footer
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
  const filenameBase = businessName.value ? businessName.value : '餐饮盈利测算'
  link.download = `${filenameBase}-${new Date().toISOString().slice(0, 10)}.png`
  link.click()
}
</script>

<template>
  <div class="tool-page restaurant-profit">
    <div class="tool-header">
      <h1>🍜 餐饮盈利计算器</h1>
      <p class="tool-desc">输入开店成本和经营参数，自动计算盈亏平衡点、保本单数、翻台率和回本周期。</p>

      <div class="history-bar">
        <button class="btn btn-sm" :disabled="!canUndo" @click="undo">↩ 撤消</button>
        <button class="btn btn-sm" :disabled="!canRedo" @click="redo">↪ 重做</button>
      </div>
    </div>

    <div class="mobile-toggle-bar">
      <button class="btn btn-sm" @click="inputCollapsed = !inputCollapsed">
        {{ inputCollapsed ? '展开输入面板' : '折叠输入面板' }}
      </button>
    </div>

    <div class="calculator-layout">
      <!-- 左侧输入 -->
      <div v-show="!inputCollapsed" id="profit-input" class="card input-panel">
        <div class="section-title">基础信息</div>
        <div class="form-row form-row-2col">
          <div class="form-col">
            <label>商区类型</label>
            <div class="district-inputs">
              <select v-model="districtType" class="select district-select">
                <option v-for="d in DISTRICT_TYPES" :key="d.key" :value="d.key">{{ d.key === 'custom' ? d.name : `${d.name}（${d.months}个月）` }}</option>
              </select>
              <input v-if="districtType === 'custom'" v-model.number="customMonths" type="number" min="1" max="12" class="input input-months">
              <span v-if="districtType === 'custom'" class="input-unit">个月</span>
            </div>
          </div>
          <div class="form-col">
            <label>面积（平）</label>
            <input v-model.number="area" type="number" class="input">
          </div>
        </div>

        <div class="section-title">开店成本</div>
        <div class="form-row">
          <label>年房租（元）</label>
          <input v-model.number="annualRent" type="number" class="input">
          <span v-if="missingRequiredFields.includes('annualRent')" class="field-warning">请填写年房租，用于计算月固定成本</span>
          <div class="payment-options">
            <button type="button" class="payment-option" :class="{ active: rentPaymentMode === 'year' }" @click="rentPaymentMode = 'year'">年付</button>
            <button type="button" class="payment-option" :class="{ active: rentPaymentMode === 'half' }" @click="rentPaymentMode = 'half'">半年付</button>
            <button type="button" class="payment-option" :class="{ active: rentPaymentMode === 'quarter' }" @click="rentPaymentMode = 'quarter'">3个月</button>
            <button type="button" class="payment-option" :class="{ active: rentPaymentMode === 'twoMonth' }" @click="rentPaymentMode = 'twoMonth'">2个月</button>
            <button type="button" class="payment-option" :class="{ active: rentPaymentMode === 'month' }" @click="rentPaymentMode = 'month'">1个月</button>
          </div>
          <div v-if="Number(annualRent || 0) > 0" class="payment-hint">
            每次支付：{{ fmtMoney(rentPaymentAmount) }} 元
          </div>
        </div>
        <div class="form-row form-row-2col">
          <div class="form-col">
            <label>押金（元）</label>
            <input v-model.number="deposit" type="number" class="input">
          </div>
          <div class="form-col">
            <label>转让费/中介费（元）</label>
            <input v-model.number="transferFee" type="number" class="input">
          </div>
        </div>
        <div class="form-row form-row-2col">
          <div class="form-col">
            <label>设备（元）</label>
            <input v-model.number="equipment" type="number" class="input">
          </div>
          <div class="form-col">
            <label>首批物料（元）</label>
            <input v-model.number="firstBatchMaterial" type="number" class="input">
          </div>
        </div>
        <div class="form-row form-row-2col">
          <div class="form-col">
            <label>加盟/技术学习费（元）</label>
            <input v-model.number="franchiseFee" type="number" class="input">
          </div>
          <div class="form-col">
            <label>装修+广告（元）</label>
            <input v-model.number="decorationAd" type="number" class="input">
          </div>
        </div>

        <div class="section-title">经营成本</div>
        <div class="form-row form-row-2col">
          <div class="form-col">
            <label>平均工资（元）</label>
            <input v-model.number="laborAvgSalary" type="number" class="input">
            <span v-if="missingRequiredFields.includes('laborAvgSalary')" class="field-warning">请填写平均工资，用于计算每月人工成本</span>
          </div>
          <div class="form-col">
            <label>人数</label>
            <input v-model.number="laborHeadcount" type="number" class="input">
          </div>
        </div>
        <div class="form-row form-row-2col">
          <div class="form-col">
            <label>水/电/杂费（元/月）</label>
            <input v-model.number="monthlyUtilities" type="number" class="input">
          </div>
          <div class="form-col">
            <label>毛利率</label>
            <input v-model.number="grossMargin" type="number" step="0.01" min="0" max="1" class="input">
            <span v-if="missingRequiredFields.includes('grossMargin')" class="field-warning">请填写毛利率，否则无法计算盈亏平衡与净利润</span>
          </div>
        </div>
        <div class="labor-hint">
          每月人工 = {{ fmtMoney(laborAvgSalary) }} × {{ laborHeadcount || 0 }} = {{ fmtMoney(monthlyLabor) }} 元
        </div>

        <div class="section-title">营业参数</div>
        <div class="form-row form-row-3col">
          <div class="form-col">
            <label>桌数</label>
            <input v-model.number="tables" type="number" class="input">
          </div>
          <div class="form-col">
            <label>座位数</label>
            <input v-model.number="seats" type="number" class="input">
            <span v-if="missingRequiredFields.includes('seats')" class="field-warning">请填写座位数，否则翻台率无意义</span>
          </div>
          <div class="form-col">
            <label>平均客单价（元）</label>
            <input v-model.number="avgTicket" type="number" class="input">
            <span v-if="missingRequiredFields.includes('avgTicket')" class="field-warning">请填写平均客单价，否则无法计算营收与保本单数</span>
          </div>
        </div>
        <div class="form-row form-row-2col">
          <div class="form-col">
            <label>目标日单数</label>
            <input v-model.number="targetDailyOrders" type="number" class="input">
            <span v-if="missingRequiredFields.includes('targetDailyOrders')" class="field-warning">请填写目标日单数，否则目标月净利润为负</span>
          </div>
          <div class="form-col">
            <label>目标月净利润（元）</label>
            <div class="computed-value" :class="{ 'text-success': targetMonthlyNetProfit > 0, 'text-error': targetMonthlyNetProfit < 0 }">
              {{ fmtMoney(targetMonthlyNetProfit) }}
            </div>
          </div>
        </div>
        <div class="form-row">
          <label>商圈名称（选填）</label>
          <input v-model="businessName" type="text" class="input" placeholder="例如：一中店">
        </div>

        <div class="form-actions">
          <button class="btn" @click="loadExample">加载表格示例</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
        </div>
      </div>

      <!-- 右侧结果 -->
      <div class="result-panel">
        <div id="core-results" class="card result-card">
          <div class="section-title">核心结果</div>
          <div class="metric-grid">
            <div class="metric clickable" @click="showDetailPopup(detailFields.buildCost.title, detailFields.buildCost.rows)">
              <div class="metric-value">{{ fmtMoney(buildCost) }}</div>
              <div class="metric-label">建店成本（元）</div>
            </div>
            <div class="metric">
              <div class="metric-value">{{ fmtMoney(effectiveMonthlyRent) }}</div>
              <div class="metric-label">每月有效房租（实际 {{ fmtMoney(actualMonthlyRent) }}）</div>
            </div>
            <div class="metric clickable" @click="showDetailPopup(detailFields.monthlyFixedCost.title, detailFields.monthlyFixedCost.rows)">
              <div class="metric-value">{{ fmtMoney(monthlyFixedCost) }}</div>
              <div class="metric-label">月固定成本（元）</div>
            </div>
            <div class="metric clickable" @click="showDetailPopup(detailFields.dailyFixedCost.title, detailFields.dailyFixedCost.rows)">
              <div class="metric-value">{{ fmtMoney(dailyFixedCost) }}</div>
              <div class="metric-label">日固定成本（元）</div>
            </div>
            <div class="metric highlight clickable" @click="showDetailPopup(detailFields.dailyBreakEvenRevenue.title, detailFields.dailyBreakEvenRevenue.rows)">
              <div class="metric-value">{{ fmtMoney(dailyBreakEvenRevenue) }}</div>
              <div class="metric-label">日盈亏平衡营业额（元）</div>
            </div>
            <div class="metric highlight">
              <div class="metric-value">{{ fmtMoney(monthlyBreakEvenRevenue) }}</div>
              <div class="metric-label">月平衡营业额（元）</div>
            </div>
            <div class="metric highlight clickable" @click="showDetailPopup(detailFields.dailyBreakEvenOrders.title, detailFields.dailyBreakEvenOrders.rows)">
              <div class="metric-value">{{ fmtNumber(dailyBreakEvenOrders, 1) }}</div>
              <div class="metric-label">保本日单数（单）</div>
            </div>
            <div class="metric highlight clickable" @click="showDetailPopup(detailFields.turnoverRate.title, detailFields.turnoverRate.rows)">
              <div class="metric-value">{{ fmtNumber(turnoverRate, 2) }}</div>
              <div class="metric-label">翻台率（单/座位）</div>
            </div>
          </div>
        </div>

        <div id="target-results" class="card result-card">
          <div class="section-title">目标经营测算（日单数 {{ targetDailyOrders }} 单）</div>
          <div v-if="hasMissingRequiredFields" class="result-warning">
            当前还有 {{ missingRequiredFields.length }} 项关键参数未填写，目标净利润可能为负数或无法准确计算：{{ missingRequiredLabels.join('、') }}
          </div>
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
            <div class="metric clickable" :class="{ 'text-success': targetMonthlyNetProfit > 0, 'text-error': targetMonthlyNetProfit < 0 }" @click="showDetailPopup(detailFields.targetMonthlyNetProfit.title, detailFields.targetMonthlyNetProfit.rows)">
              <div class="metric-value">{{ fmtMoney(targetMonthlyNetProfit) }}</div>
              <div class="metric-label">目标月净利润（元）</div>
            </div>
            <div class="metric clickable" @click="showDetailPopup(detailFields.paybackMonths.title, detailFields.paybackMonths.rows)">
              <div class="metric-value">{{ paybackMonths === Infinity ? '无法回本' : fmtNumber(paybackMonths, 1) }}</div>
              <div class="metric-label">回本周期（月）</div>
            </div>
          </div>
        </div>

        <div class="download-bar">
          <button class="btn" @click="downloadResultsAsImage">保存图片</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="detailPopup.visible" class="detail-popup-overlay" @click.self="closeDetailPopup">
        <div class="detail-popup">
          <div class="detail-popup-header">
            <h3>{{ detailPopup.title }}</h3>
            <button class="detail-popup-close" @click="closeDetailPopup">×</button>
          </div>
          <div class="detail-popup-body">
            <div
              v-for="(row, idx) in detailPopup.rows"
              :key="idx"
              class="detail-row"
              :class="{ 'detail-row-total': idx === detailPopup.rows.length - 1 }"
            >
              <span class="detail-label">{{ row[0] }}</span>
              <span class="detail-value">{{ row[1] }} <span class="detail-unit">{{ row[2] }}</span></span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <nav class="bottom-nav">
      <button @click="scrollToSection('profit-input')">录入数据</button>
      <button @click="scrollToSection('core-results')">核心结果</button>
      <button @click="scrollToSection('target-results')">目标测算</button>
    </nav>
  </div>
</template>

<style scoped>
.mobile-toggle-bar {
  display: none;
}
.bottom-nav {
  display: none;
}

.restaurant-profit {
  max-width: 1200px;
}
.tool-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
  margin-bottom: 16px;
}
.history-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.history-bar .btn-sm {
  font-size: 13px;
  padding: 5px 10px;
}
.history-bar .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.calculator-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
}

/* 隐藏 number 输入框的上下箭头 */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
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
.form-row.form-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.form-row.form-row-3col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.form-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.computed-value {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  min-height: 36px;
  display: flex;
  align-items: center;
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
  margin: -6px 0 10px;
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
.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
.download-bar {
  margin-top: 16px;
}
.payment-options {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.payment-option {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
}
.payment-option.active {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.payment-hint {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}
.labor-hint {
  margin-top: -6px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 8px 10px;
  border-radius: var(--radius);
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
  position: relative;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  padding: 14px;
  text-align: center;
}
.metric.clickable {
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.metric.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.metric.clickable::after {
  content: 'ℹ';
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1;
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

/* 必填项缺失提示 */
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

/* 详情弹窗 */
.detail-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}
.detail-popup {
  background: var(--bg-primary);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 380px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.detail-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.detail-popup-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}
.detail-popup-close {
  background: none;
  border: none;
  font-size: 22px;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
}
.detail-popup-body {
  padding: 12px 16px;
  overflow-y: auto;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px dashed var(--border);
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-row-total {
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 4px;
  padding-top: 10px;
  border-top: 2px solid var(--border);
  border-bottom: none;
}
.detail-label {
  color: var(--text-secondary);
}
.detail-value {
  color: var(--text-primary);
  font-weight: 600;
  text-align: right;
}
.detail-unit {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 400;
}

@media (max-width: 900px) {
  .mobile-toggle-bar {
    display: flex;
    position: fixed;
    top: calc(var(--header-height) + 8px);
    right: 12px;
    z-index: 30;
  }
  .mobile-toggle-bar .btn {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    color: var(--text-primary);
    font-size: 13px;
    padding: 6px 12px;
  }
  .calculator-layout {
    grid-template-columns: 1fr;
    margin-top: 44px;
  }
  .restaurant-profit {
    padding-bottom: 80px;
  }
  #profit-input,
  #core-results,
  #target-results {
    scroll-margin-top: 52px;
  }
  .bottom-nav {
    display: flex;
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 8px;
    z-index: 30;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 6px 12px calc(6px + env(safe-area-inset-bottom));
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  }
  .bottom-nav button {
    flex: 1;
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 13px;
    padding: 8px 4px;
    cursor: pointer;
    transition: color 0.2s;
  }
  .bottom-nav button:active,
  .bottom-nav button:focus-visible {
    color: var(--accent);
  }
  .metric-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .metric {
    padding: 12px 8px;
  }
  .metric-value {
    font-size: 18px;
  }
  .metric-label {
    font-size: 11px;
  }
  .form-row.form-row-3col {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }
  .form-row.form-row-3col .form-col label {
    font-size: 12px;
  }
  .form-row.form-row-3col .input {
    padding: 8px 6px;
  }
}

@media (max-width: 360px) {
  .form-row.form-row-3col {
    grid-template-columns: 1fr;
  }
}
</style>
