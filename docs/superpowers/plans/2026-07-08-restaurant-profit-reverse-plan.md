# 餐饮反向调研计算器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增餐饮反向调研计算器，支持通过日营业额、月净利润或日均客户数单一数据反推店铺日均单数、营收、净利润与翻台率。

**Architecture:** 新增纯函数计算模块 `restaurantProfitReverse.js` 封装三种反推逻辑；新增独立 Vue 页面组件负责交互、本地存储与图片导出；通过路由与首页入口注册新工具。

**Tech Stack:** Vue 3 + Vite + @vueuse/core + 原生 Canvas API

## Global Constraints

- 所有工具均为纯前端，不调用后端 API。
- 数据使用 `@vueuse/core` 的 `useStorage` 持久化到浏览器 `localStorage`。
- 计算函数必须是纯函数，便于单元测试。
- 交互风格与现有「餐饮盈利计算器」保持一致。
- 移动端适配左输入 / 右结果布局，底部吸底导航。
- 页面标题、描述遵循现有路由 `meta` 格式。
- 首页工具卡片需归入合适分类，确保用户可发现。

---

## File Structure

| 文件 | 类型 | 职责 |
|---|---|---|
| `frontend/src/logic/restaurantProfitReverse.js` | 新建 | 三种反推模式的纯函数计算逻辑 |
| `frontend/src/logic/__tests__/restaurantProfitReverse.test.js` | 新建 | 使用 Node 内置 `node:test` 编写的单元测试 |
| `frontend/src/views/tools/RestaurantProfitReverseCalculator.vue` | 新建 | 反向调研计算器页面组件 |
| `frontend/src/router/index.js` | 修改 | 注册 `/tools/restaurant-profit-reverse` 路由 |
| `frontend/src/views/Home.vue` | 修改 | 在首页工具列表与分类中加入新工具 |

---

### Task 1: 编写反向计算纯函数模块

**Files:**
- Create: `frontend/src/logic/restaurantProfitReverse.js`
- Test: `frontend/src/logic/__tests__/restaurantProfitReverse.test.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `resolveMonthlyFixedCost({ monthlyFixedCost, yearlyFixedCost })` → `number`
  - `calcFromDailyRevenue({ dailyRevenue, avgTicket, grossMargin, monthlyFixedCost, seats, daysPerMonth })` → `ReverseResult`
  - `calcFromMonthlyNetProfit({ monthlyNetProfit, avgTicket, grossMargin, monthlyFixedCost, seats, daysPerMonth })` → `ReverseResult`
  - `calcFromDailyCustomers({ dailyCustomers, avgTicket, grossMargin, monthlyFixedCost, seats, daysPerMonth, customerToOrderRatio })` → `ReverseResult`

- [ ] **Step 1: 编写计算模块代码**

Create `frontend/src/logic/restaurantProfitReverse.js`:

```javascript
/**
 * 餐饮反向调研计算结果
 * @typedef {Object} ReverseResult
 * @property {number} dailyOrders - 日均单数
 * @property {number} dailyRevenue - 日营业额
 * @property {number} monthlyRevenue - 月营业额
 * @property {number} monthlyNetProfit - 月净利润
 * @property {number|null} turnoverRate - 翻台率（座位数大于 0 时有值）
 */

/**
 * 解析出实际用于计算的月固定成本
 * @param {Object} params
 * @param {number} [params.monthlyFixedCost=0]
 * @param {number} [params.yearlyFixedCost=0]
 * @returns {number}
 */
export function resolveMonthlyFixedCost({ monthlyFixedCost = 0, yearlyFixedCost = 0 } = {}) {
  const monthly = Number(monthlyFixedCost) || 0
  const yearly = Number(yearlyFixedCost) || 0
  if (monthly > 0) return monthly
  if (yearly > 0) return yearly / 12
  return 0
}

/**
 * 模式 A：已知日营业额，反推日均单数等指标
 * @param {Object} params
 * @param {number} params.dailyRevenue
 * @param {number} params.avgTicket
 * @param {number} params.grossMargin
 * @param {number} params.monthlyFixedCost
 * @param {number} [params.seats=0]
 * @param {number} [params.daysPerMonth=30]
 * @returns {ReverseResult}
 */
export function calcFromDailyRevenue({
  dailyRevenue,
  avgTicket,
  grossMargin,
  monthlyFixedCost,
  seats = 0,
  daysPerMonth = 30,
}) {
  const revenue = Number(dailyRevenue) || 0
  const ticket = Number(avgTicket) || 0
  const margin = Number(grossMargin) || 0
  const fixed = Number(monthlyFixedCost) || 0
  const seatCount = Number(seats) || 0
  const days = Number(daysPerMonth) || 30

  const dailyOrders = ticket > 0 ? revenue / ticket : 0
  const monthlyRevenue = revenue * days
  const monthlyNetProfit = monthlyRevenue * margin - fixed
  const turnoverRate = seatCount > 0 ? dailyOrders / seatCount : null

  return {
    dailyOrders,
    dailyRevenue: revenue,
    monthlyRevenue,
    monthlyNetProfit,
    turnoverRate,
  }
}

/**
 * 模式 B：已知月净利润，反推月营业额、日营业额、日均单数等指标
 * @param {Object} params
 * @param {number} params.monthlyNetProfit
 * @param {number} params.avgTicket
 * @param {number} params.grossMargin
 * @param {number} params.monthlyFixedCost
 * @param {number} [params.seats=0]
 * @param {number} [params.daysPerMonth=30]
 * @returns {ReverseResult}
 */
export function calcFromMonthlyNetProfit({
  monthlyNetProfit,
  avgTicket,
  grossMargin,
  monthlyFixedCost,
  seats = 0,
  daysPerMonth = 30,
}) {
  const profit = Number(monthlyNetProfit) || 0
  const ticket = Number(avgTicket) || 0
  const margin = Number(grossMargin) || 0
  const fixed = Number(monthlyFixedCost) || 0
  const seatCount = Number(seats) || 0
  const days = Number(daysPerMonth) || 30

  const monthlyRevenue = margin > 0 ? (profit + fixed) / margin : 0
  const dailyRevenue = monthlyRevenue / days
  const dailyOrders = ticket > 0 ? dailyRevenue / ticket : 0
  const turnoverRate = seatCount > 0 ? dailyOrders / seatCount : null

  return {
    dailyOrders,
    dailyRevenue,
    monthlyRevenue,
    monthlyNetProfit: profit,
    turnoverRate,
  }
}

/**
 * 模式 C：已知日均客户数，反推日均单数、营业额、利润等指标
 * @param {Object} params
 * @param {number} params.dailyCustomers
 * @param {number} params.avgTicket
 * @param {number} params.grossMargin
 * @param {number} params.monthlyFixedCost
 * @param {number} [params.seats=0]
 * @param {number} [params.daysPerMonth=30]
 * @param {number} [params.customerToOrderRatio=1]
 * @returns {ReverseResult}
 */
export function calcFromDailyCustomers({
  dailyCustomers,
  avgTicket,
  grossMargin,
  monthlyFixedCost,
  seats = 0,
  daysPerMonth = 30,
  customerToOrderRatio = 1,
}) {
  const customers = Number(dailyCustomers) || 0
  const ticket = Number(avgTicket) || 0
  const margin = Number(grossMargin) || 0
  const fixed = Number(monthlyFixedCost) || 0
  const seatCount = Number(seats) || 0
  const days = Number(daysPerMonth) || 30
  const ratio = Number(customerToOrderRatio) || 1

  const dailyOrders = customers * ratio
  const dailyRevenue = dailyOrders * ticket
  const monthlyRevenue = dailyRevenue * days
  const monthlyNetProfit = monthlyRevenue * margin - fixed
  const turnoverRate = seatCount > 0 ? dailyOrders / seatCount : null

  return {
    dailyOrders,
    dailyRevenue,
    monthlyRevenue,
    monthlyNetProfit,
    turnoverRate,
  }
}
```

- [ ] **Step 2: 编写单元测试**

Create `frontend/src/logic/__tests__/restaurantProfitReverse.test.js`:

```javascript
import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  resolveMonthlyFixedCost,
  calcFromDailyRevenue,
  calcFromMonthlyNetProfit,
  calcFromDailyCustomers,
} from '../restaurantProfitReverse.js'

describe('resolveMonthlyFixedCost', () => {
  it('优先返回月固定成本', () => {
    assert.strictEqual(resolveMonthlyFixedCost({ monthlyFixedCost: 15000, yearlyFixedCost: 200000 }), 15000)
  })

  it('月固定成本为 0 时，用年固定成本换算', () => {
    assert.strictEqual(resolveMonthlyFixedCost({ monthlyFixedCost: 0, yearlyFixedCost: 120000 }), 10000)
  })

  it('两者都为 0 时返回 0', () => {
    assert.strictEqual(resolveMonthlyFixedCost({ monthlyFixedCost: 0, yearlyFixedCost: 0 }), 0)
  })
})

describe('calcFromDailyRevenue', () => {
  it('根据日营业额反推日均单数与利润', () => {
    const result = calcFromDailyRevenue({
      dailyRevenue: 2000,
      avgTicket: 20,
      grossMargin: 0.6,
      monthlyFixedCost: 15000,
      seats: 24,
      daysPerMonth: 30,
    })

    assert.strictEqual(result.dailyOrders, 100)
    assert.strictEqual(result.dailyRevenue, 2000)
    assert.strictEqual(result.monthlyRevenue, 60000)
    assert.strictEqual(result.monthlyNetProfit, 21000)
    assert.strictEqual(result.turnoverRate, 100 / 24)
  })

  it('客单价为 0 时日均单数为 0', () => {
    const result = calcFromDailyRevenue({
      dailyRevenue: 2000,
      avgTicket: 0,
      grossMargin: 0.6,
      monthlyFixedCost: 15000,
    })
    assert.strictEqual(result.dailyOrders, 0)
  })

  it('未填座位数时翻台率为 null', () => {
    const result = calcFromDailyRevenue({
      dailyRevenue: 2000,
      avgTicket: 20,
      grossMargin: 0.6,
      monthlyFixedCost: 15000,
    })
    assert.strictEqual(result.turnoverRate, null)
  })
})

describe('calcFromMonthlyNetProfit', () => {
  it('根据月净利润反推月营业额与日单数', () => {
    const result = calcFromMonthlyNetProfit({
      monthlyNetProfit: 8000,
      avgTicket: 25,
      grossMargin: 0.55,
      monthlyFixedCost: 18000,
      seats: 30,
      daysPerMonth: 30,
    })

    assert.strictEqual(result.monthlyRevenue, (8000 + 18000) / 0.55)
    assert.strictEqual(result.dailyRevenue, result.monthlyRevenue / 30)
    assert.strictEqual(result.dailyOrders, result.dailyRevenue / 25)
    assert.strictEqual(result.turnoverRate, result.dailyOrders / 30)
  })

  it('毛利率为 0 时月营业额为 0', () => {
    const result = calcFromMonthlyNetProfit({
      monthlyNetProfit: 8000,
      avgTicket: 25,
      grossMargin: 0,
      monthlyFixedCost: 18000,
    })
    assert.strictEqual(result.monthlyRevenue, 0)
  })
})

describe('calcFromDailyCustomers', () => {
  it('根据日均客户数反推日营业额与利润', () => {
    const result = calcFromDailyCustomers({
      dailyCustomers: 80,
      avgTicket: 18,
      grossMargin: 0.5,
      monthlyFixedCost: 12000,
      daysPerMonth: 30,
    })

    assert.strictEqual(result.dailyOrders, 80)
    assert.strictEqual(result.dailyRevenue, 1440)
    assert.strictEqual(result.monthlyRevenue, 43200)
    assert.strictEqual(result.monthlyNetProfit, 9600)
  })

  it('客户到订单转化率可调整', () => {
    const result = calcFromDailyCustomers({
      dailyCustomers: 80,
      avgTicket: 18,
      grossMargin: 0.5,
      monthlyFixedCost: 12000,
      customerToOrderRatio: 0.8,
    })

    assert.strictEqual(result.dailyOrders, 64)
    assert.strictEqual(result.dailyRevenue, 64 * 18)
  })
})
```

- [ ] **Step 3: 运行单元测试**

Run:

```bash
cd /Users/box/new/Mac/web-Project/frontend
node --test src/logic/__tests__/restaurantProfitReverse.test.js
```

Expected: all 8 tests pass.

- [ ] **Step 4: 提交**

```bash
git add src/logic/restaurantProfitReverse.js src/logic/__tests__/restaurantProfitReverse.test.js
git commit -m "feat(餐饮反向调研): 新增反向计算逻辑与单元测试"
```

---

### Task 2: 创建反向调研计算器页面组件

**Files:**
- Create: `frontend/src/views/tools/RestaurantProfitReverseCalculator.vue`

**Interfaces:**
- Consumes: `calcFromDailyRevenue`, `calcFromMonthlyNetProfit`, `calcFromDailyCustomers`, `resolveMonthlyFixedCost` from `frontend/src/logic/restaurantProfitReverse.js`
- Produces: 页面组件，注册到路由后可直接访问

- [ ] **Step 1: 创建组件文件**

Create `frontend/src/views/tools/RestaurantProfitReverseCalculator.vue` with the following structure (implementation should match existing `RestaurantProfitCalculator.vue` style; the component below is the complete reference):

```vue
<script setup>
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import {
  resolveMonthlyFixedCost,
  calcFromDailyRevenue,
  calcFromMonthlyNetProfit,
  calcFromDailyCustomers,
} from '../../logic/restaurantProfitReverse.js'

const MODES = [
  { key: 'dailyRevenue', name: '日营业额', unit: '元/天', placeholder: '例如：2000' },
  { key: 'monthlyNetProfit', name: '月净利润', unit: '元/月', placeholder: '例如：8000' },
  { key: 'dailyCustomers', name: '日均客户数', unit: '人/天', placeholder: '例如：80' },
]

const mode = useStorage('rpr-mode', 'dailyRevenue')
const observedValue = useStorage('rpr-observed-value', 0)
const avgTicket = useStorage('rpr-avg-ticket', 0)
const grossMargin = useStorage('rpr-gross-margin', 0)
const monthlyFixedCost = useStorage('rpr-monthly-fixed-cost', 0)
const yearlyFixedCost = useStorage('rpr-yearly-fixed-cost', 0)
const seats = useStorage('rpr-seats', 0)
const customerToOrderRatio = useStorage('rpr-customer-to-order-ratio', 1)
const daysPerMonth = useStorage('rpr-days-per-month', 30)
const businessName = useStorage('rpr-business-name', '')

const selectedMode = computed(() => MODES.find(m => m.key === mode.value) || MODES[0])

const effectiveMonthlyFixedCost = computed(() =>
  resolveMonthlyFixedCost({
    monthlyFixedCost: monthlyFixedCost.value,
    yearlyFixedCost: yearlyFixedCost.value,
  })
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
      return calcFromDailyCustomers({ ...common, dailyCustomers: observedValue.value, customerToOrderRatio: customerToOrderRatio.value })
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
  observedValue.value = 2000
  avgTicket.value = 20
  grossMargin.value = 0.6
  monthlyFixedCost.value = 15000
  yearlyFixedCost.value = 0
  seats.value = 24
  customerToOrderRatio.value = 1
  daysPerMonth.value = 30
}

function clearAll() {
  mode.value = 'dailyRevenue'
  observedValue.value = 0
  avgTicket.value = 0
  grossMargin.value = 0
  monthlyFixedCost.value = 0
  yearlyFixedCost.value = 0
  seats.value = 0
  customerToOrderRatio.value = 1
  daysPerMonth.value = 30
  businessName.value = ''
}

function downloadResultsAsImage() {
  if (!businessName.value) {
    const name = window.prompt('请填写商圈名称（可直接留空跳过）')
    if (name !== null) {
      businessName.value = name.trim()
    }
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
    ['月固定成本', `${fmtMoney(effectiveMonthlyFixedCost.value)} 元`],
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
  for (let i = 2; i < 6; i++) {
    drawRow(rows[i][0], rows[i][1])
  }

  y += sectionGap
  drawSectionTitle('反推结果')
  for (let i = 6; i < rows.length; i++) {
    ctx.fillStyle = '#6b7280'
    ctx.fillText(rows[i][0], padding, y)
    const color = i === 9
      ? (result.value.monthlyNetProfit >= 0 ? '#16a34a' : '#dc2626')
      : '#111827'
    ctx.fillStyle = color
    ctx.font = i === 9 ? 'bold 14px sans-serif' : '14px sans-serif'
    ctx.fillText(rows[i][1], valueX, y)
    ctx.font = '14px sans-serif'
    y += lineHeight
  }

  y += sectionGap
  ctx.fillStyle = '#9ca3af'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('由 在线工具箱 生成，数据仅供参考', width / 2, y)
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
  link.download = `餐饮反向调研-${new Date().toISOString().slice(0, 10)}.png`
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
          <input v-model.number="observedValue" type="number" class="input" :placeholder="selectedMode.placeholder">
        </div>

        <div class="section-title">估算参数</div>
        <div class="form-row">
          <label>平均客单价（元）</label>
          <input v-model.number="avgTicket" type="number" class="input" placeholder="例如：20">
        </div>
        <div class="form-row">
          <label>毛利率</label>
          <input v-model.number="grossMargin" type="number" step="0.01" min="0" max="1" class="input" placeholder="0.6 表示 60%">
        </div>
        <div class="form-row form-row-2col">
          <div class="form-col">
            <label>月固定成本（元）</label>
            <input v-model.number="monthlyFixedCost" type="number" class="input" placeholder="例如：15000">
          </div>
          <div class="form-col">
            <label>年固定成本（元）</label>
            <input v-model.number="yearlyFixedCost" type="number" class="input" placeholder="会自动换算成月">
          </div>
        </div>
        <div class="form-row form-row-2col">
          <div class="form-col">
            <label>座位数</label>
            <input v-model.number="seats" type="number" class="input" placeholder="用于算翻台率">
          </div>
          <div class="form-col">
            <label>每月营业天数</label>
            <input v-model.number="daysPerMonth" type="number" min="1" max="31" class="input">
          </div>
        </div>
        <div v-if="mode === 'dailyCustomers'" class="form-row">
          <label>客户→订单转化率（默认 1 = 一人一单）</label>
          <input v-model.number="customerToOrderRatio" type="number" step="0.01" min="0" max="2" class="input">
        </div>
        <div class="form-row">
          <label>商圈名称（选填）</label>
          <input v-model="businessName" type="text" class="input" placeholder="例如：一中店">
        </div>

        <div class="form-actions">
          <button class="btn" @click="loadExample">加载示例</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
        </div>      
      </div>

      <!-- 右侧结果 -->
      <div class="result-panel">
        <div id="reverse-results" class="card result-card">
          <div class="section-title">反推结果</div>
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
          <ul class="param-list">
            <li>平均客单价：{{ fmtMoney(avgTicket) }} 元</li>
            <li>毛利率：{{ ((grossMargin || 0) * 100).toFixed(0) }}%</li>
            <li>月固定成本：{{ fmtMoney(effectiveMonthlyFixedCost) }} 元</li>
            <li v-if="mode === 'dailyCustomers'">客户→订单转化率：{{ customerToOrderRatio }}</li>
            <li>每月营业天数：{{ daysPerMonth }} 天</li>
          </ul>
        </div>

        <div class="download-bar">
          <button class="btn" @click="downloadResultsAsImage">下载调研结果图片</button>
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
.param-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-secondary);
}
.hint-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}
</style>
```

- [ ] **Step 2: 验证构建**

Run:

```bash
cd /Users/box/new/Mac/web-Project/frontend
npm run build
```

Expected: build completes without errors.

- [ ] **Step 3: 提交**

```bash
git add src/views/tools/RestaurantProfitReverseCalculator.vue
git commit -m "feat(餐饮反向调研): 新增反向调研计算器页面组件"
```

---

### Task 3: 注册路由与首页入口

**Files:**
- Modify: `frontend/src/router/index.js`
- Modify: `frontend/src/views/Home.vue`

**Interfaces:**
- Consumes: `RestaurantProfitReverseCalculator.vue` component
- Produces: route `/tools/restaurant-profit-reverse` and home page tool card

- [ ] **Step 1: 添加路由**

In `frontend/src/router/index.js`, add the following route after the existing `/tools/restaurant-profit` route (around line 359):

```javascript
    {
      path: '/tools/restaurant-profit-reverse',
      name: 'restaurant-profit-reverse',
      component: () => import('../views/tools/RestaurantProfitReverseCalculator.vue'),
      meta: {
        title: '餐饮反向调研',
        description: '餐饮店竞品反向调研工具，通过日营业额、月净利润或日均客户数反推日均单数、营业额、净利润与翻台率。'
      }
    },
```

- [ ] **Step 2: 添加首页工具卡片与分类**

In `frontend/src/views/Home.vue`:

1. Add to the `tools` array (around line 54, before the closing bracket):

```javascript
  { path: '/tools/restaurant-profit', name: '餐饮盈利计算器', icon: '🍜', desc: '开店成本、盈亏平衡、回本周期测算', category: '商业' },
  { path: '/tools/restaurant-profit-reverse', name: '餐饮反向调研', icon: '🕵️‍♂️', desc: '通过单一数据反推竞品营收与翻台率', category: '商业' },
```

2. Add a new category to the `categories` array (after the `driving` category, around line 151):

```javascript
  {
    key: 'business',
    name: '商业测算',
    icon: '📊',
    desc: '餐饮盈利测算与竞品反向调研工具',
    paths: [
      '/tools/restaurant-profit',
      '/tools/restaurant-profit-reverse',
    ]
  }
```

- [ ] **Step 3: 验证本地访问**

Run:

```bash
cd /Users/box/new/Mac/web-Project/frontend
npm run dev -- --host 127.0.0.1
```

Then open `http://127.0.0.1:5173/tools/restaurant-profit-reverse` and verify:
- Page loads with title "餐饮反向调研"
- Mode selector switches between 日营业额 / 月净利润 / 日均客户数
- Loading example populates inputs and results
- Home page shows both restaurant tools under "商业测算"

- [ ] **Step 4: 提交**

```bash
git add src/router/index.js src/views/Home.vue
git commit -m "feat(餐饮反向调研): 注册路由与首页入口"
```

---

### Task 4: 构建验证与最终检查

**Files:**
- Modify: none (verification task)

- [ ] **Step 1: 生产构建**

Run:

```bash
cd /Users/box/new/Mac/web-Project/frontend
npm run build
```

Expected: build completes successfully, `dist/` contains the new tool chunk.

- [ ] **Step 2: 运行单元测试**

Run:

```bash
node --test src/logic/__tests__/restaurantProfitReverse.test.js
```

Expected: all tests pass.

- [ ] **Step 3: 提交（如需要修复）**

If any fixes were made, commit them:

```bash
git add ...
git commit -m "fix(餐饮反向调研): 构建与测试修复"
```

---

## Self-Review

### Spec Coverage

| 设计文档要求 | 对应任务 |
|---|---|
| 三种反推模式（日营业额/月净利润/日均客户数） | Task 1, Task 2 |
| 月固定成本/年固定成本二选一 + 自动换算 | Task 1 (`resolveMonthlyFixedCost`), Task 2 (UI) |
| 核心输出：日均单数、日营业额、月营业额、月净利润、翻台率 | Task 1, Task 2 |
| 客户→订单转化率（默认 1:1） | Task 1, Task 2 |
| 加载示例、清空、下载图片 | Task 2 |
| 独立页面 | Task 3 (route `/tools/restaurant-profit-reverse`) |
| 首页可发现 | Task 3 (Home.vue 工具卡片 + 分类) |

### Placeholder Scan

- 无 "TBD"、"TODO"、"implement later"。
- 所有代码片段完整，可直接复制使用。
- 所有文件路径精确。

### Type Consistency

- 计算模块统一使用 `Number()` 转换输入，返回对象字段一致。
- Vue 组件通过 `computed` 调用计算模块，字段名与模块输出一致。

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-08-restaurant-profit-reverse-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
