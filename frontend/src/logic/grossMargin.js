/**
 * 毛利率计算纯逻辑。
 */

/** 保留两位小数的四舍五入 */
export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

/**
 * 根据食材成本与售价计算毛利、毛利率及逐步计算过程。
 * @param {number|string} cost - 食材成本（元）。
 * @param {number|string} price - 售价（元）。
 * @returns {{
 *   cost: number,
 *   price: number,
 *   grossProfit: number,
 *   grossMarginRate: number,
 *   valid: boolean,
 *   negative: boolean,
 *   warning: string|null,
 *   steps: Array<{ label: string, formula: string, result: number, unit: string }>
 * }}
 */
export function calcGrossMargin(cost, price) {
  const c = round2(Math.max(0, Number(cost) || 0))
  const p = round2(Math.max(0, Number(price) || 0))

  const grossProfit = round2(p - c)
  const grossMarginRate = p > 0 ? round2((grossProfit / p) * 100) : 0
  const negative = p > 0 && c >= p

  let warning = null
  if (negative) warning = '成本已覆盖售价，毛利率为负数，请调整定价'
  else if (p > 0 && c > p * 0.7) warning = '毛利率偏低（成本占售价超过 70%），建议关注成本控制'

  const steps = [
    {
      label: '毛利',
      formula: `${p} − ${c}`,
      result: grossProfit,
      unit: '元',
    },
    {
      label: '毛利率',
      formula: `${grossProfit} ÷ ${p} × 100%`,
      result: round2(grossMarginRate),
      unit: '%',
    },
  ]

  return { cost: c, price: p, grossProfit, grossMarginRate, valid: p > 0, negative, warning, steps }
}
