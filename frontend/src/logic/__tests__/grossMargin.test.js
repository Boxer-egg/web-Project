import { describe, it } from 'node:test'
import assert from 'node:assert'
import { calcGrossMargin, round2 } from '../grossMargin.js'

describe('round2', () => {
  it('四舍五入保留两位小数', () => {
    assert.strictEqual(round2(57.1428), 57.14)
    assert.strictEqual(round2(57.146), 57.15)
  })
})

describe('calcGrossMargin', () => {
  it('正常盈利：成本 12、售价 28，毛利率约 57.14%', () => {
    const r = calcGrossMargin(12, 28)
    assert.strictEqual(r.grossProfit, 16)
    assert.strictEqual(r.grossMarginRate, 57.14)
    assert.strictEqual(r.valid, true)
    assert.strictEqual(r.negative, false)
    assert.strictEqual(r.warning, null)
  })

  it('生成逐步计算过程（毛利 + 毛利率）', () => {
    const r = calcGrossMargin(12, 28)
    assert.strictEqual(r.steps.length, 2)
    assert.strictEqual(r.steps[0].label, '毛利')
    assert.strictEqual(r.steps[0].formula, '28 − 12')
    assert.strictEqual(r.steps[0].result, 16)
    assert.strictEqual(r.steps[1].label, '毛利率')
    assert.strictEqual(r.steps[1].formula, '16 ÷ 28 × 100%')
    assert.strictEqual(r.steps[1].result, 57.14)
  })

  it('成本 ≥ 售价：返回负毛利率并给出警告', () => {
    const r = calcGrossMargin(20, 18)
    assert.strictEqual(r.grossProfit, -2)
    assert.strictEqual(r.grossMarginRate, -11.11)
    assert.strictEqual(r.negative, true)
    assert.ok(r.warning && r.warning.includes('负数'))
  })

  it('成本等于售价：毛利率为 0 且警告', () => {
    const r = calcGrossMargin(18, 18)
    assert.strictEqual(r.grossProfit, 0)
    assert.strictEqual(r.grossMarginRate, 0)
    assert.strictEqual(r.negative, true)
    assert.ok(r.warning)
  })

  it('售价为 0 时 invalid，不计算毛利率', () => {
    const r = calcGrossMargin(10, 0)
    assert.strictEqual(r.valid, false)
    assert.strictEqual(r.grossMarginRate, 0)
    assert.strictEqual(r.negative, false)
  })

  it('字符串与负数输入被规范化', () => {
    const r = calcGrossMargin('12.5', '-5')
    assert.strictEqual(r.cost, 12.5)
    assert.strictEqual(r.price, 0)
    assert.strictEqual(r.valid, false)
  })

  it('成本为 0 且售价为正：毛利率 100%', () => {
    const r = calcGrossMargin(0, 30)
    assert.strictEqual(r.grossProfit, 30)
    assert.strictEqual(r.grossMarginRate, 100)
    assert.strictEqual(r.negative, false)
  })
})
