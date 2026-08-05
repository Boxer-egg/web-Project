<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted, reactive } from 'vue'
import { useStorage } from '@vueuse/core'
import { getUrlParams, applyParams, toNumber, syncParamsToUrl, buildShareUrl } from '../../utils/urlParams.js'
import { useToast } from '../../composables/useToast.js'

const toast = useToast()

/** 商区类型配置 */
const DISTRICT_TYPES = [
  { key: 'school', name: '学校商区', months: 8, note: '寒暑假客流大幅下降，通常按 8 个月有效营业计算' },
  { key: 'community', name: '社区商区', months: 12, note: '全年营业，周末和节假日客流较好' },
  { key: 'office', name: '写字楼商区', months: 12, note: '工作日午餐为主，周末客流较少' },
  { key: 'scenic', name: '景区/季节性商区', months: 6, note: '旺季集中，淡季可歇业或大幅减员' },
  { key: 'custom', name: '自定义', months: 12, note: '手动设置营业月数' },
]

/** 输入项（带本地存储） */
const districtType = useStorage('rpf-district-type', 'community')
const area = useStorage('rpf-area', 0)
const annualRent = useStorage('rpf-annual-rent', 0)
const deposit = useStorage('rpf-deposit', 0)
const transferFee = useStorage('rpf-transfer-fee', 0)
const franchiseFee = useStorage('rpf-franchise-fee', 0)
const decorationAd = useStorage('rpf-decoration-ad', 0)
const equipment = useStorage('rpf-equipment', 0)
const firstBatchMaterial = useStorage('rpf-first-batch-material', 0)
const laborAvgSalary = useStorage('rpf-labor-avg-salary', 0)
const laborHeadcount = useStorage('rpf-labor-headcount', 1)
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

/**
 * URL 分享参数映射。key 为 query 参数名，default 为缺省值（缺省时不写入链接）。
 */
const shareMapping = {
  district: { ref: districtType, default: 'community' },
  area: { ref: area, default: 0 },
  rent: { ref: annualRent, default: 0 },
  deposit: { ref: deposit, default: 0 },
  transfer: { ref: transferFee, default: 0 },
  franchise: { ref: franchiseFee, default: 0 },
  decor: { ref: decorationAd, default: 0 },
  equip: { ref: equipment, default: 0 },
  material: { ref: firstBatchMaterial, default: 0 },
  salary: { ref: laborAvgSalary, default: 0 },
  staff: { ref: laborHeadcount, default: 1 },
  util: { ref: monthlyUtilities, default: 0 },
  gm: { ref: grossMargin, default: 0 },
  ticket: { ref: avgTicket, default: 0 },
  seats: { ref: seats, default: 0 },
  tables: { ref: tables, default: 0 },
  months: { ref: customMonths, default: 12 },
  target: { ref: targetDailyOrders, default: 0 },
  name: { ref: businessName, default: '' },
  paymode: { ref: rentPaymentMode, default: 'year' },
}

/**
 * 打开分享链接时把 URL 参数回填到表单。
 * 在撤销/重做历史初始化之前执行，避免 URL 回填污染撤销栈。
 */
applyParams(getUrlParams(), {
  district: { ref: districtType, allowed: DISTRICT_TYPES.map(d => d.key) },
  area: { ref: area, transform: toNumber },
  rent: { ref: annualRent, transform: toNumber },
  deposit: { ref: deposit, transform: toNumber },
  transfer: { ref: transferFee, transform: toNumber },
  franchise: { ref: franchiseFee, transform: toNumber },
  decor: { ref: decorationAd, transform: toNumber },
  equip: { ref: equipment, transform: toNumber },
  material: { ref: firstBatchMaterial, transform: toNumber },
  salary: { ref: laborAvgSalary, transform: toNumber },
  staff: { ref: laborHeadcount, transform: toNumber },
  util: { ref: monthlyUtilities, transform: toNumber },
  gm: { ref: grossMargin, transform: toNumber },
  ticket: { ref: avgTicket, transform: toNumber },
  seats: { ref: seats, transform: toNumber },
  tables: { ref: tables, transform: toNumber },
  months: { ref: customMonths, transform: toNumber },
  target: { ref: targetDailyOrders, transform: toNumber },
  name: { ref: businessName },
  paymode: { ref: rentPaymentMode, allowed: ['year', 'half', 'quarter', 'twoMonth', 'month'] },
})

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

/** 图表弹窗状态 */
const chartPopupVisible = ref(false)
const chartSelectedOrders = ref(0)
const pieCanvasRef = ref(null)
const barCanvasRef = ref(null)
const lineCanvasRef = ref(null)

/** 图表容器 ref，用于自适应尺寸 */
const pieWrapRef = ref(null)
const barWrapRef = ref(null)
const lineWrapRef = ref(null)

/** 饼图悬停状态 */
const pieHoverInfo = ref(null)
const pieHoverStyle = ref({})

/** 防抖重绘定时器 */
let redrawTimer = null

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
  { key: 'monthlyUtilities', label: '水/电/杂费' },
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

/** 目标净利润率 = 目标月净利润 / 目标月营收 */
const targetNetProfitMargin = computed(() => {
  const revenue = targetMonthlyRevenue.value
  return revenue > 0 ? targetMonthlyNetProfit.value / revenue : 0
})

/** 快餐健康指标参考配置与当前值 */
const HEALTH_REFERENCES = {
  grossMargin: { label: '毛利率', min: 0.45, format: v => fmtPercent(v), ref: '45%–65%' },
  turnoverRate: { label: '翻台率', min: 3, format: v => `${fmtNumber(v, 1)} 次/天`, ref: '≥3 次/天' },
  paybackMonths: { label: '回本周期', min: 6, max: 12, format: v => `${fmtNumber(v, 1)} 个月`, ref: '6–12 个月' },
  netProfitMargin: { label: '净利润率', min: 0.08, format: v => fmtPercent(v), ref: '≥8%' },
}

const healthValues = computed(() => ({
  grossMargin: Number(grossMargin.value) || 0,
  turnoverRate: turnoverRate.value,
  paybackMonths: paybackMonths.value,
  netProfitMargin: targetNetProfitMargin.value,
}))

/**
 * 判断健康指标是否处于行业参考区间。
 * @param {string} key - 指标 key
 * @param {number} value - 当前值
 * @returns {{ok: boolean, color: string}} 状态与颜色
 */
function getHealthStatus(key, value) {
  const cfg = HEALTH_REFERENCES[key]
  if (!cfg) return { ok: true, color: 'var(--text-primary)' }

  // 回本周期：超过上限为不健康，低于下限视为优秀（绿色）
  if (key === 'paybackMonths') {
    if (!Number.isFinite(value) || value > cfg.max) return { ok: false, color: 'var(--error)' }
    return { ok: true, color: 'var(--success)' }
  }

  if (cfg.min !== undefined && value < cfg.min) return { ok: false, color: 'var(--error)' }
  if (cfg.max !== undefined && value > cfg.max) return { ok: false, color: 'var(--error)' }
  return { ok: true, color: 'var(--success)' }
}

/** 折线图 X 轴固定最大单数，保证用户可在 0–150 单范围内观察盈利拐点 */
const LINE_X_MAX = 150

/** 折线图 X 轴最大值 */
const lineXMax = computed(() => LINE_X_MAX)

/** 当前选中日单数对应的经营指标 */
const selectedDailyRevenue = computed(() => chartSelectedOrders.value * (Number(avgTicket.value) || 0))
const selectedMonthlyRevenue = computed(() => selectedDailyRevenue.value * 30)
const selectedMonthlyGrossProfit = computed(() => selectedMonthlyRevenue.value * (Number(grossMargin.value) || 0))
const selectedMonthlyNetProfit = computed(() => selectedMonthlyGrossProfit.value - monthlyFixedCost.value)

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

/**
 * 数字输入框编辑状态。
 * 某些浏览器对 type="number" 输入框会在删除首位后把前导零折叠为 0，
 * 导致用户希望保留位数的输入（如 10000 删除 1 后输入 2）变成 2 而非 20000。
 * 此处用一个临时的字符串状态在编辑期间保留原始字符，失焦后再回退到数字值。
 */
const numberEditing = reactive({})

/**
 * 获取数字输入框的当前显示值。
 * @param {string} key - 字段标识
 * @param {number} value - 字段实际数值
 * @returns {string} 编辑中字符串或数值字符串
 */
function getNumberDisplay(key, value) {
  if (key in numberEditing) return numberEditing[key]
  return String(value ?? 0)
}

/**
 * 整数输入框 input 事件处理：过滤非数字字符，同步更新数值。
 * @param {InputEvent} event - 输入事件
 * @param {Ref<number>} refObj - 对应响应式引用
 * @param {string} key - 字段标识
 */
function onIntegerInput(event, refObj, key) {
  const raw = event.target.value
  const filtered = raw.replace(/[^0-9]/g, '')
  numberEditing[key] = filtered
  refObj.value = filtered === '' ? 0 : Number(filtered)
  event.target.value = filtered
}

/**
 * 整数输入框 blur 事件处理：清除编辑状态，让输入框显示格式化后的数值。
 * @param {string} key - 字段标识
 */
function onIntegerBlur(key) {
  delete numberEditing[key]
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
  districtType.value = 'community'
  area.value = 0
  annualRent.value = 0
  deposit.value = 0
  transferFee.value = 0
  franchiseFee.value = 0
  decorationAd.value = 0
  equipment.value = 0
  firstBatchMaterial.value = 0
  laborAvgSalary.value = 0
  laborHeadcount.value = 1
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

/** 将数值限制在 [min, max] 区间 */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

/** 获取 canvas 2d 上下文并按 DPR 缩放 */
function prepareCanvas(canvas, cssWidth, cssHeight) {
  if (!canvas) return null
  const dpr = Math.max(window.devicePixelRatio || 1, 2)
  canvas.style.width = `${cssWidth}px`
  canvas.style.height = `${cssHeight}px`
  canvas.width = Math.floor(cssWidth * dpr)
  canvas.height = Math.floor(cssHeight * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.scale(dpr, dpr)
  return ctx
}

/** 生成折线图采样数据 */
function generateLineData() {
  const maxX = lineXMax.value
  const ticket = Number(avgTicket.value) || 0
  const margin = Number(grossMargin.value) || 0
  const fixed = Number(monthlyFixedCost.value) || 0
  const count = 20
  const points = []
  for (let i = 0; i <= count; i++) {
    const dailyOrders = (maxX * i) / count
    const dailyRevenue = dailyOrders * ticket
    const monthlyRevenue = dailyRevenue * 30
    const monthlyGrossProfit = monthlyRevenue * margin
    const monthlyNetProfit = monthlyGrossProfit - fixed
    points.push({ x: dailyOrders, y: monthlyNetProfit })
  }
  return points
}

/** 绘制成本结构环形饼图 */
function drawCostPieChart(ctx, width, height, data) {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 24
  const innerRadius = radius * 0.55
  const total = data.reduce((sum, d) => sum + d.value, 0)

  // 背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  if (total <= 0) {
    ctx.fillStyle = '#9ca3af'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('暂无数据', centerX, centerY)
    return
  }

  const slices = []
  let startAngle = -Math.PI / 2
  for (const item of data) {
    const sliceAngle = (item.value / total) * Math.PI * 2
    const endAngle = startAngle + sliceAngle
    const midAngle = startAngle + sliceAngle / 2
    const percent = total > 0 ? ((item.value / total) * 100) : 0

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = item.color
    ctx.fill()

    slices.push({ item, startAngle, endAngle, midAngle, percent })
    startAngle = endAngle
  }

  // 挖空中心形成环形
  ctx.beginPath()
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  // 中心文字
  ctx.fillStyle = '#111827'
  ctx.font = 'bold 15px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('月固定成本', centerX, centerY - 4)
  ctx.font = 'bold 17px sans-serif'
  ctx.textBaseline = 'top'
  ctx.fillText(`¥${fmtMoney(total)}`, centerX, centerY + 4)

  // 扇区百分比标注（写在扇形内部，避免被 canvas 边缘截断）
  const labelRadius = (radius + innerRadius) / 2
  ctx.font = 'bold 13px sans-serif'
  for (const slice of slices) {
    if (slice.percent < 5) continue
    const mid = slice.midAngle
    const x = centerX + Math.cos(mid) * labelRadius
    const y = centerY + Math.sin(mid) * labelRadius
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${slice.percent.toFixed(1)}%`, x, y)
  }

  // 图例
  const legendX = 16
  let legendY = height - 14 - data.length * 18
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = '12px sans-serif'
  for (const item of data) {
    ctx.fillStyle = item.color
    ctx.fillRect(legendX, legendY - 5, 10, 10)
    ctx.fillStyle = '#4b5563'
    ctx.fillText(`${item.label} ${fmtMoney(item.value)}`, legendX + 16, legendY)
    legendY += 18
  }
}

/** 绘制盈亏构成横向柱状图 */
function drawBreakEvenBarChart(ctx, width, height, data, options = {}) {
  const padding = { top: 32, right: 56, bottom: 32, left: 56 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const ticket = Number(options.avgTicket) || 0

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  const values = data.map(d => d.value)
  const maxValue = Math.max(...values, 1)
  // 右轴按单数 × 客单价映射到左轴，保证柱子可比
  const orderItem = data.find(d => d.unit === '单')
  let rightAxisMax = 0
  if (orderItem) {
    rightAxisMax = ticket > 0 ? maxValue / ticket : orderItem.value * 2 || 1
  }

  // 标题
  // 不在 chart 内绘制标题，避免与顶部数值/标注重叠，由弹窗结构提供上下文

  // 左轴
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, height - padding.bottom)
  ctx.stroke()

  // 左轴刻度
  ctx.fillStyle = '#6b7280'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= 4; i++) {
    const y = height - padding.bottom - (chartHeight * i) / 4
    const val = (maxValue * i) / 4
    ctx.fillText(`¥${fmtMoney(val)}`, padding.left - 6, y)
    if (i > 0) {
      ctx.strokeStyle = '#f3f4f6'
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }
  }

  // 右轴
  if (orderItem) {
    ctx.strokeStyle = '#e5e7eb'
    ctx.beginPath()
    ctx.moveTo(width - padding.right, padding.top)
    ctx.lineTo(width - padding.right, height - padding.bottom)
    ctx.stroke()

    ctx.fillStyle = '#3b82f6'
    ctx.textAlign = 'left'
    for (let i = 0; i <= 4; i++) {
      const y = height - padding.bottom - (chartHeight * i) / 4
      const val = (rightAxisMax * i) / 4
      ctx.fillText(`${fmtNumber(val, 0)}单`, width - padding.right + 6, y)
    }
  }

  // 柱子
  const barCount = data.length
  const barSlot = chartWidth / barCount
  const barWidth = Math.min(barSlot * 0.5, 48)

  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * chartHeight
    const x = padding.left + barSlot * index + (barSlot - barWidth) / 2
    const y = height - padding.bottom - barHeight

    ctx.fillStyle = item.color
    ctx.fillRect(x, y, barWidth, barHeight)

    // 末端数值
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    const labelText = item.unit === '单' ? fmtNumber(item.value, 1) : fmtMoney(item.value)
    ctx.fillText(`${labelText}${item.unit}`, x + barWidth / 2, y - 4)

    // 标签
    ctx.fillStyle = '#4b5563'
    ctx.font = '11px sans-serif'
    ctx.textBaseline = 'top'
    const lines = item.label.split('\n')
    lines.forEach((line, lineIdx) => {
      ctx.fillText(line, x + barWidth / 2, height - padding.bottom + 6 + lineIdx * 13)
    })

    // 保本线标注
    if (item.marker) {
      ctx.fillStyle = '#ef4444'
      ctx.font = '10px sans-serif'
      ctx.textBaseline = 'bottom'
      ctx.fillText(item.marker, x + barWidth / 2, y - 20)
    }
  })
}

/** 绘制盈利拐点折线图 */
function drawProfitLineChart(ctx, width, height, data, options = {}) {
  const padding = { top: 36, right: 24, bottom: 48, left: 64 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const points = data.points || []
  const selectedX = options.selectedX ?? null
  const selectedY = options.selectedY ?? 0
  const breakEvenX = options.breakEvenX ?? 0

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  if (points.length === 0) return

  const xMin = points[0].x
  const xMax = points[points.length - 1].x
  const yValues = points.map(p => p.y)
  let yMin = Math.min(...yValues, 0)
  let yMax = Math.max(...yValues, 0)
  if (yMin === yMax) {
    yMin = -1
    yMax = 1
  }
  const yRange = yMax - yMin

  function getX(x) {
    return padding.left + ((x - xMin) / (xMax - xMin || 1)) * chartWidth
  }
  function getY(y) {
    return padding.top + chartHeight - ((y - yMin) / yRange) * chartHeight
  }

  // 标题
  ctx.fillStyle = '#111827'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('盈利拐点分析', width / 2, 8)

  // 网格线
  ctx.strokeStyle = '#f3f4f6'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight * i) / 4
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()
  }

  // Y 轴
  ctx.strokeStyle = '#e5e7eb'
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, height - padding.bottom)
  ctx.stroke()

  // Y 轴刻度和标签
  ctx.fillStyle = '#6b7280'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight * i) / 4
    const val = yMax - (yRange * i) / 4
    ctx.fillText(`¥${fmtMoney(val)}`, padding.left - 6, y)
  }

  // X 轴
  ctx.strokeStyle = '#e5e7eb'
  ctx.beginPath()
  ctx.moveTo(padding.left, height - padding.bottom)
  ctx.lineTo(width - padding.right, height - padding.bottom)
  ctx.stroke()

  // X 轴刻度
  ctx.fillStyle = '#6b7280'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (let i = 0; i <= 4; i++) {
    const x = padding.left + (chartWidth * i) / 4
    const val = xMin + ((xMax - xMin) * i) / 4
    ctx.fillText(`${fmtNumber(val, 0)}单`, x, height - padding.bottom + 6)
  }

  // X 轴公式
  ctx.fillStyle = '#9ca3af'
  ctx.font = 'italic 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('月净利润 = 日单数 × 客单价 × 30 × 毛利率 − 月固定成本', width / 2, height - 12)

  // 零利润参考线
  const zeroY = getY(0)
  ctx.strokeStyle = '#9ca3af'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(padding.left, zeroY)
  ctx.lineTo(width - padding.right, zeroY)
  ctx.stroke()
  ctx.setLineDash([])

  // 月净利润折线（按正负分段绘制颜色）
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  function drawSegment(pointsList, color) {
    if (pointsList.length < 2) return
    ctx.beginPath()
    pointsList.forEach((p, idx) => {
      const x = getX(p.x)
      const y = getY(p.y)
      if (idx === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.stroke()
  }

  function crossZeroX(a, b) {
    // a, b 为 {x, y}，返回直线与 y=0 的交点 x
    return a.x - (a.y * (b.x - a.x)) / (b.y - a.y)
  }

  const positivePoints = []
  const negativePoints = []

  for (let i = 0; i < points.length; i++) {
    const curr = points[i]
    const prev = i > 0 ? points[i - 1] : null

    if (curr.y >= 0) {
      if (prev && prev.y < 0) {
        const xz = crossZeroX(prev, curr)
        const crossPoint = { x: xz, y: 0 }
        negativePoints.push(crossPoint)
        positivePoints.push(crossPoint)
      }
      positivePoints.push(curr)
    } else {
      if (prev && prev.y >= 0) {
        const xz = crossZeroX(prev, curr)
        const crossPoint = { x: xz, y: 0 }
        positivePoints.push(crossPoint)
        negativePoints.push(crossPoint)
      }
      negativePoints.push(curr)
    }
  }

  drawSegment(negativePoints, '#ef4444')
  drawSegment(positivePoints, '#22c55e')

  // 竖直参考线
  if (selectedX !== null && selectedX >= xMin && selectedX <= xMax) {
    const sx = getX(selectedX)
    ctx.strokeStyle = '#9ca3af'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(sx, padding.top)
    ctx.lineTo(sx, height - padding.bottom)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 保本点标注
  if (breakEvenX > 0 && breakEvenX <= xMax) {
    const bx = getX(breakEvenX)
    const by = getY(0)
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(bx, by, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`保本线：${fmtNumber(breakEvenX, 1)}单/天`, bx - 10, by - 10)
  }

  // 当前选中点标注（跟随滑块）
  if (selectedX !== null && selectedX >= xMin && selectedX <= xMax) {
    const tx = getX(selectedX)
    const ty = getY(selectedY)
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    const starRadius = 6
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2
      const r = i % 2 === 0 ? starRadius : starRadius / 2
      const sx = tx + Math.cos(angle) * r
      const sy = ty + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(sx, sy)
      else ctx.lineTo(sx, sy)
    }
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#d97706'
    ctx.font = 'bold 11px sans-serif'
    // 当前点标注放在黄星右侧，避免与保本线标注重叠；
    // 若太靠近右边界，则改放到左侧
    const labelText = `当前：${fmtNumber(selectedX, 0)}单/天，月利润¥${fmtMoney(selectedY)}`
    const labelWidth = ctx.measureText(labelText).width
    if (tx + labelWidth + 14 <= width - padding.right) {
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(labelText, tx + 10, ty)
    } else {
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(labelText, tx - 10, ty)
    }
  }
}

/** 根据容器尺寸重绘三个图表 */
function redrawCharts() {
  if (!chartPopupVisible.value) return
  if (hasMissingRequiredFields.value) return

  nextTick(() => {
    // 饼图
    if (pieCanvasRef.value && pieWrapRef.value) {
      const rect = pieWrapRef.value.getBoundingClientRect()
      const size = Math.min(rect.width, 260)
      const ctx = prepareCanvas(pieCanvasRef.value, size, size)
      if (ctx) {
        drawCostPieChart(ctx, size, size, [
          { label: '有效房租', value: effectiveMonthlyRent.value, color: '#3b82f6' },
          { label: '人工', value: monthlyLabor.value, color: '#f59e0b' },
          { label: '水电杂费', value: monthlyUtilities.value, color: '#22c55e' },
        ])
        ctx.restore()
      }
    }

    // 柱状图
    if (barCanvasRef.value && barWrapRef.value) {
      const rect = barWrapRef.value.getBoundingClientRect()
      const w = rect.width
      const h = Math.max(w * 0.5, 160)
      const ctx = prepareCanvas(barCanvasRef.value, w, h)
      if (ctx) {
        drawBreakEvenBarChart(ctx, w, h, [
          { label: '日固定成本', value: dailyFixedCost.value, color: '#ef4444', unit: '元' },
          { label: '日盈亏平衡\n营业额', value: dailyBreakEvenRevenue.value, color: '#f59e0b', unit: '元', marker: '保本线' },
          { label: '保本日单数', value: dailyBreakEvenOrders.value, color: '#3b82f6', unit: '单' },
        ], { avgTicket: avgTicket.value })
        ctx.restore()
      }
    }

    // 折线图
    if (lineCanvasRef.value && lineWrapRef.value) {
      const rect = lineWrapRef.value.getBoundingClientRect()
      const w = rect.width
      const h = Math.max(w * 0.57, 220)
      const ctx = prepareCanvas(lineCanvasRef.value, w, h)
      if (ctx) {
        drawProfitLineChart(ctx, w, h, {
          points: generateLineData(),
        }, {
          selectedX: chartSelectedOrders.value,
          selectedY: selectedMonthlyNetProfit.value,
          breakEvenX: dailyBreakEvenOrders.value,
        })
        ctx.restore()
      }
    }
  })
}

/** 防抖重绘 */
function debouncedRedrawCharts() {
  if (redrawTimer) clearTimeout(redrawTimer)
  redrawTimer = setTimeout(() => redrawCharts(), 150)
}

/** 饼图悬停提示 */
function onPieMouseMove(e) {
  const canvas = pieCanvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.max(window.devicePixelRatio || 1, 2)
  const cssSize = Math.min(rect.width, 260)
  const centerX = cssSize / 2
  const centerY = cssSize / 2
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const dx = mx - centerX
  const dy = my - centerY
  const dist = Math.sqrt(dx * dx + dy * dy)
  const radius = cssSize / 2 - 24
  const innerRadius = radius * 0.55

  if (dist > radius || dist < innerRadius) {
    pieHoverInfo.value = null
    return
  }

  const total = effectiveMonthlyRent.value + monthlyLabor.value + monthlyUtilities.value
  if (total <= 0) { pieHoverInfo.value = null; return }

  let angle = Math.atan2(dy, dx)
  if (angle < -Math.PI / 2) angle += Math.PI * 2

  const slices = [
    { label: '有效房租', value: effectiveMonthlyRent.value, color: '#3b82f6' },
    { label: '人工', value: monthlyLabor.value, color: '#f59e0b' },
    { label: '水电杂费', value: monthlyUtilities.value, color: '#22c55e' },
  ]

  let startAngle = -Math.PI / 2
  for (const s of slices) {
    const sliceAngle = (s.value / total) * Math.PI * 2
    const endAngle = startAngle + sliceAngle
    if (angle >= startAngle && angle < endAngle) {
      const pct = ((s.value / total) * 100).toFixed(1)
      pieHoverInfo.value = `${s.label}：¥${fmtMoney(s.value)}（${pct}%）`
      pieHoverStyle.value = { left: `${mx}px`, top: `${my}px` }
      return
    }
    startAngle = endAngle
  }
  pieHoverInfo.value = null
}

function onPieMouseLeave() {
  pieHoverInfo.value = null
}

/** 打开图表弹窗 */
function openChartPopup() {
  chartPopupVisible.value = true
  const maxX = lineXMax.value
  const target = Number(targetDailyOrders.value) || 0
  chartSelectedOrders.value = clamp(target || maxX / 2, 0, maxX)
  redrawCharts()
}

/** 关闭图表弹窗 */
function closeChartPopup() {
  chartPopupVisible.value = false
}

/** 处理弹窗内滑块/输入框变化 */
function onChartSelectedOrdersInput(val) {
  const maxX = lineXMax.value
  const num = Number(val) || 0
  chartSelectedOrders.value = clamp(num, 0, maxX)
  // 滑块/输入框变化只需重绘竖直参考线，使用立即重绘保证跟手
  redrawCharts()
}

/** 监听关键输入变化，弹窗打开时重绘 */
watch(
  [grossMargin, avgTicket, targetDailyOrders, annualRent, laborAvgSalary, monthlyUtilities, laborHeadcount, districtType, customMonths],
  () => {
    if (chartPopupVisible.value) {
      const maxX = lineXMax.value
      chartSelectedOrders.value = clamp(chartSelectedOrders.value, 0, maxX)
      debouncedRedrawCharts()
    }
  },
  { deep: true }
)

/** 监听弹窗显示状态 */
watch(chartPopupVisible, (visible) => {
  if (visible) {
    redrawCharts()
  }
})

/** 窗口大小变化时重绘 */
function onResize() {
  if (chartPopupVisible.value) {
    debouncedRedrawCharts()
  }
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('orientationchange', onResize)
  if (redrawTimer) clearTimeout(redrawTimer)
})

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
  const textHeight = contentHeight + padding * 2

  const canvas = document.createElement('canvas')
  const dpr = Math.max(window.devicePixelRatio || 1, 2)
  canvas.width = width * dpr
  // 先设置一个足够大的高度，最终再裁剪
  canvas.height = 2400 * dpr
  canvas.style.width = `${width}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, 2400)

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

  let finalHeight = y + padding

  // 若关键字段完整，在文本区域下方追加三个图表
  if (!hasMissingRequiredFields.value) {
    const chartMarginTop = 24
    const chartGap = 20
    y += chartMarginTop

    // 饼图
    const pieSize = 240
    const pieCanvas = document.createElement('canvas')
    const pieCtx = prepareCanvas(pieCanvas, pieSize, pieSize)
    if (pieCtx) {
      drawCostPieChart(pieCtx, pieSize, pieSize, [
        { label: '有效房租', value: effectiveMonthlyRent.value, color: '#3b82f6' },
        { label: '人工', value: monthlyLabor.value, color: '#f59e0b' },
        { label: '水电杂费', value: monthlyUtilities.value, color: '#22c55e' },
      ])
      pieCtx.restore()
      const pieX = (width - pieSize) / 2
      ctx.drawImage(pieCanvas, 0, 0, pieSize * dpr, pieSize * dpr, pieX, y, pieSize, pieSize)
      y += pieSize + chartGap
    }

    // 柱状图
    const barW = width - padding * 2
    const barH = 200
    const barCanvas = document.createElement('canvas')
    const barCtx = prepareCanvas(barCanvas, barW, barH)
    if (barCtx) {
      drawBreakEvenBarChart(barCtx, barW, barH, [
        { label: '日固定成本', value: dailyFixedCost.value, color: '#ef4444', unit: '元' },
        { label: '日盈亏平衡\n营业额', value: dailyBreakEvenRevenue.value, color: '#f59e0b', unit: '元', marker: '保本线' },
        { label: '保本日单数', value: dailyBreakEvenOrders.value, color: '#3b82f6', unit: '单' },
      ], { avgTicket: avgTicket.value })
      barCtx.restore()
      ctx.drawImage(barCanvas, 0, 0, barW * dpr, barH * dpr, padding, y, barW, barH)
      y += barH + chartGap
    }

    // 折线图
    const lineW = width - padding * 2
    const lineH = 272
    const lineCanvas = document.createElement('canvas')
    const lineCtx = prepareCanvas(lineCanvas, lineW, lineH)
    if (lineCtx) {
      drawProfitLineChart(lineCtx, lineW, lineH, {
        points: generateLineData(),
      }, {
        selectedX: targetDailyOrders.value,
        selectedY: targetMonthlyNetProfit.value,
        breakEvenX: dailyBreakEvenOrders.value,
      })
      lineCtx.restore()
      ctx.drawImage(lineCanvas, 0, 0, lineW * dpr, lineH * dpr, padding, y, lineW, lineH)
      y += lineH + chartGap
    }

    finalHeight = y + padding
  }

  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = width * dpr
  exportCanvas.height = finalHeight * dpr
  const ectx = exportCanvas.getContext('2d')
  if (!ectx) return
  ectx.drawImage(canvas, 0, 0, width * dpr, finalHeight * dpr, 0, 0, width * dpr, finalHeight * dpr)

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
            <input
              :value="getNumberDisplay('transferFee', transferFee)"
              @input="onIntegerInput($event, transferFee, 'transferFee')"
              @blur="onIntegerBlur('transferFee')"
              type="text"
              inputmode="numeric"
              class="input"
            >
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
            <span v-if="laborHeadcount > 0 && laborAvgSalary > 0" class="labor-inline-hint">总工资 {{ fmtMoney(monthlyLabor) }} 元</span>
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
        <div class="section-title">营业参数</div>
        <div class="form-row form-row-3col">
          <div class="form-col">
            <label>桌数</label>
            <input v-model.number="tables" type="number" class="input">
          </div>
          <div class="form-col">
            <label>座位数</label>
            <input v-model.number="seats" type="number" class="input">
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
          <button class="btn" @click="copyShareLink">🔗 复制分享链接</button>
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

          <div class="chart-action-bar">
            <button class="btn" @click="openChartPopup">查看图表分析</button>
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

    <Teleport to="body">
      <div v-if="chartPopupVisible" class="chart-popup-overlay" @click.self="closeChartPopup">
        <div class="chart-popup" role="dialog" aria-modal="true" aria-label="图表分析">
          <div class="chart-popup-header">
            <h3>📊 图表分析</h3>
            <button class="chart-popup-close" @click="closeChartPopup">×</button>
          </div>
          <div class="chart-popup-body">
            <div v-if="hasMissingRequiredFields" class="chart-placeholder">
              请填写{{ missingRequiredLabels.join('、') }}后查看图表
            </div>
            <template v-else>
              <div class="chart-block chart-top-row">
                <div ref="pieWrapRef" class="chart-canvas-wrap chart-pie-wrap" style="position:relative">
                  <canvas ref="pieCanvasRef" aria-label="成本结构环形饼图" @mousemove="onPieMouseMove" @mouseleave="onPieMouseLeave"></canvas>
                  <div v-if="pieHoverInfo" class="pie-tooltip" :style="pieHoverStyle">{{ pieHoverInfo }}</div>
                </div>
                <div class="chart-reference chart-reference-inline">
                  <div class="chart-reference-title">📌 快餐健康指标参考</div>
                  <div class="chart-reference-grid">
                    <div
                      v-for="(cfg, key) in HEALTH_REFERENCES"
                      :key="key"
                      class="chart-reference-item"
                    >
                      <div class="chart-reference-header">
                        <span class="chart-reference-label">{{ cfg.label }}</span>
                        <span
                          class="chart-reference-current"
                          :style="{ color: getHealthStatus(key, healthValues[key]).color }"
                        >
                          {{ cfg.format(healthValues[key]) }}
                        </span>
                      </div>
                      <div class="chart-reference-ref">参考 {{ cfg.ref }}</div>
                    </div>
                  </div>
                  <p class="chart-reference-note">以上数值为快餐/简餐行业经验区间，实际经营需结合选址、客单价和商圈客流综合判断。</p>
                </div>
              </div>

              <div class="chart-block">
                <div ref="barWrapRef" class="chart-canvas-wrap">
                  <canvas ref="barCanvasRef" aria-label="盈亏构成横向柱状图"></canvas>
                </div>
              </div>

              <div class="chart-block">
                <div class="line-controls">
                  <label for="chart-orders-slider">日均单数</label>
                  <input
                    id="chart-orders-slider"
                    type="range"
                    min="0"
                    :max="lineXMax"
                    step="1"
                    :value="chartSelectedOrders"
                    @input="onChartSelectedOrdersInput($event.target.value)"
                  >
                  <input
                    type="number"
                    min="0"
                    :max="lineXMax"
                    step="1"
                    :value="chartSelectedOrders"
                    class="input chart-orders-input"
                    @input="onChartSelectedOrdersInput($event.target.value)"
                  >
                  <span class="chart-orders-unit">单</span>
                </div>
                <div ref="lineWrapRef" class="chart-canvas-wrap">
                  <canvas ref="lineCanvasRef" aria-label="盈利拐点折线图"></canvas>
                </div>
                <div class="line-metrics">
                  <div class="line-metric">
                    <span class="line-metric-label">日营收</span>
                    <span class="line-metric-value">¥{{ fmtMoney(selectedDailyRevenue) }}</span>
                  </div>
                  <div class="line-metric">
                    <span class="line-metric-label">月营收</span>
                    <span class="line-metric-value">¥{{ fmtMoney(selectedMonthlyRevenue) }}</span>
                  </div>
                  <div class="line-metric">
                    <span class="line-metric-label">月毛利</span>
                    <span class="line-metric-value">¥{{ fmtMoney(selectedMonthlyGrossProfit) }}</span>
                  </div>
                  <div class="line-metric">
                    <span class="line-metric-label">月净利润</span>
                    <span class="line-metric-value" :class="{ 'text-success': selectedMonthlyNetProfit > 0, 'text-error': selectedMonthlyNetProfit < 0 }">¥{{ fmtMoney(selectedMonthlyNetProfit) }}</span>
                  </div>
                </div>
              </div>
            </template>
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
.labor-inline-hint {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
  margin-top: 2px;
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
  -webkit-user-select: none;
  user-select: none;
}
.metric.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.metric.clickable:active {
  outline: none;
  background: color-mix(in srgb, var(--text-muted) 6%, var(--bg-secondary));
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

.chart-action-bar {
  margin-top: 20px;
  display: flex;
  justify-content: center;
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

/* 图表弹窗 */
.chart-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 101;
  padding: 40px 16px;
  overflow-y: auto;
}
.chart-popup {
  background: var(--bg-primary);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 720px;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chart-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.chart-popup-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}
.chart-popup-close {
  background: none;
  border: none;
  font-size: 22px;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
}
.chart-popup-body {
  padding: 20px;
  overflow-y: auto;
}
.chart-placeholder {
  text-align: center;
  padding: 48px 20px;
  color: var(--text-secondary);
  font-size: 14px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}
.chart-block {
  margin-bottom: 24px;
}
.chart-block:last-child {
  margin-bottom: 0;
}
.chart-canvas-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow: hidden;
}
.chart-canvas-wrap canvas {
  display: block;
  max-width: 100%;
  height: auto;
}
.chart-pie-wrap {
  max-width: 260px;
  margin: 0 auto;
}

.chart-top-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}
.chart-top-row > .chart-pie-wrap,
.chart-top-row > .chart-reference-inline {
  margin: 0;
  width: 100%;
  max-width: none;
}
.chart-reference-inline {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.line-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.line-controls label {
  font-size: 13px;
  color: var(--text-secondary);
}
.line-controls input[type="range"] {
  flex: 1;
  min-width: 120px;
}
.chart-orders-input {
  width: 80px;
}
.chart-orders-unit {
  font-size: 13px;
  color: var(--text-secondary);
}
.line-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.line-metric {
  background: var(--bg-secondary);
  border-radius: var(--radius);
  padding: 10px;
  text-align: center;
}
.line-metric-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.line-metric-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.chart-reference {
  margin-top: 16px;
  padding: 14px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.chart-reference-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}
.chart-reference-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}
.chart-reference-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: var(--bg-primary);
  border-radius: var(--radius);
  font-size: 13px;
}
.chart-reference-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}
.chart-reference-label {
  color: var(--text-secondary);
}
.chart-reference-ref {
  font-size: 11px;
  color: var(--text-muted);
}
.chart-reference-current {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}
.chart-reference-value {
  font-weight: 700;
  color: var(--text-primary);
}
.chart-reference-note {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}
.pie-tooltip {
  position: absolute;
  transform: translate(-50%, -120%);
  background: #1f2937;
  color: #ffffff;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
  .chart-popup-overlay {
    padding: 16px 12px;
  }
  .chart-popup {
    max-height: calc(100vh - 32px);
  }
  .chart-popup-body {
    padding: 16px;
  }
  .chart-top-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 360px) {
  .form-row.form-row-3col {
    grid-template-columns: 1fr;
  }
}
</style>
