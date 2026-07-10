import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  resolveMonthlyRent,
  calcFromDailyRevenue,
  calcFromMonthlyNetProfit,
  calcFromDailyCustomers,
} from '../restaurantProfitReverse.js'

describe('resolveMonthlyRent', () => {
  it('优先返回月租金', () => {
    assert.strictEqual(resolveMonthlyRent({ monthlyRent: 15000, yearlyRent: 200000 }), 15000)
  })

  it('月租金为 0 时，用年租金换算', () => {
    assert.strictEqual(resolveMonthlyRent({ monthlyRent: 0, yearlyRent: 120000 }), 10000)
  })

  it('两者都为 0 时返回 0', () => {
    assert.strictEqual(resolveMonthlyRent({ monthlyRent: 0, yearlyRent: 0 }), 0)
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

  it('日均客户数直接等于日均单数', () => {
    const result = calcFromDailyCustomers({
      dailyCustomers: 80,
      avgTicket: 18,
      grossMargin: 0.5,
      monthlyFixedCost: 12000,
    })

    assert.strictEqual(result.dailyOrders, 80)
    assert.strictEqual(result.dailyRevenue, 80 * 18)
  })
})
