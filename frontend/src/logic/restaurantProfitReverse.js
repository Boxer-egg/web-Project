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
