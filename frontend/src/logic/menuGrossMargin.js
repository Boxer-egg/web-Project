let _id = 0
function uid() {
  return `id_${Date.now().toString(36)}_${(_id++).toString(36)}`
}

/** 创建新的原材料记录 */
export function createIngredient(name = '', cost = 0) {
  return { id: uid(), name, cost: Math.max(0, Number(cost) || 0) }
}

/** 创建新的单品 */
export function createDish(name = '', price = 0, ingredients = []) {
  return {
    id: uid(),
    name: String(name || ''),
    price: Math.max(0, Number(price) || 0),
    ingredients: ingredients.length > 0 ? ingredients : [createIngredient()]
  }
}

/** 创建新的套餐项（引用单品） */
export function createComboItem(dishId = '', quantity = 1) {
  return { dishId: String(dishId), quantity: Math.max(0, Number(quantity) || 0) }
}

/** 创建新的套餐 */
export function createCombo(name = '', price = 0, items = []) {
  return {
    id: uid(),
    name: String(name || ''),
    price: Math.max(0, Number(price) || 0),
    items: items.length > 0 ? items : [createComboItem()]
  }
}

/** 创建新的菜单方案 */
export function createProfile(name = '默认菜单', dishes = [], combos = [], options = {}) {
  return {
    id: uid(),
    name: String(name || '默认菜单'),
    dishes,
    combos,
    proportionMode: options.proportionMode || 'percentage', // 'percentage' | 'relative'
    dishProportions: options.dishProportions || {}, // { [dishId]: value }
    comboProportions: options.comboProportions || {}, // { [comboId]: value }
    includeCombosInOverall: Boolean(options.includeCombosInOverall)
  }
}

/** 计算单品成本、毛利、毛利率 */
export function calculateDish(dish) {
  const cost = dish.ingredients.reduce((sum, ing) => sum + (Number(ing.cost) || 0), 0)
  const grossProfit = dish.price - cost
  const grossMarginRate = dish.price > 0 ? grossProfit / dish.price : 0
  return {
    id: dish.id,
    name: dish.name,
    price: dish.price,
    cost,
    grossProfit,
    grossMarginRate,
    valid: dish.price > 0 && cost >= 0
  }
}

/** 根据单品列表计算套餐成本、毛利、毛利率、折扣率 */
export function calculateCombo(combo, dishesMap) {
  const items = combo.items
    .map((item) => {
      const dish = dishesMap.get(item.dishId)
      if (!dish) return null
      const calculated = calculateDish(dish)
      return {
        ...item,
        dishName: dish.name,
        dishPrice: calculated.price,
        dishCost: calculated.cost,
        totalPrice: calculated.price * item.quantity,
        totalCost: calculated.cost * item.quantity
      }
    })
    .filter(Boolean)

  const cost = items.reduce((sum, item) => sum + item.totalCost, 0)
  const originalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const grossProfit = combo.price - cost
  const grossMarginRate = combo.price > 0 ? grossProfit / combo.price : 0
  const discountRate = originalPrice > 0 ? combo.price / originalPrice : 0

  return {
    id: combo.id,
    name: combo.name,
    price: combo.price,
    cost,
    originalPrice,
    grossProfit,
    grossMarginRate,
    discountRate,
    items,
    valid: combo.price > 0 && cost >= 0 && items.length > 0
  }
}

/** 计算整体菜单毛利率
 * @param {object} profile
 * @param {Map<string, object>} dishesMap
 * @param {Map<string, object>} combosMap
 */
export function calculateOverall(profile, dishesMap, combosMap) {
  const dishCalculations = profile.dishes
    .map((dish) => calculateDish(dish))
    .filter((d) => d.valid)

  const comboCalculations = profile.includeCombosInOverall
    ? profile.combos.map((combo) => calculateCombo(combo, dishesMap)).filter((c) => c.valid)
    : []

  const allItems = [
    ...dishCalculations.map((d) => ({ ...d, type: 'dish', proportion: profile.dishProportions[d.id] || 0 })),
    ...comboCalculations.map((c) => ({ ...c, type: 'combo', proportion: profile.comboProportions[c.id] || 0 }))
  ]

  if (allItems.length === 0) {
    return {
      overallGrossMarginRate: 0,
      totalSales: 0,
      totalCost: 0,
      totalGrossProfit: 0,
      items: []
    }
  }

  let weightedMargin = 0
  let totalSales = 0
  let totalCost = 0
  let totalGrossProfit = 0

  if (profile.proportionMode === 'percentage') {
    // Normalize proportions if sum > 0
    const proportionSum = allItems.reduce((sum, item) => sum + Number(item.proportion || 0), 0)
    allItems.forEach((item) => {
      const normalizedProportion = proportionSum > 0 ? Number(item.proportion || 0) / proportionSum : 0
      const sales = item.price * normalizedProportion
      const cost = item.cost * normalizedProportion
      const grossProfit = sales - cost
      weightedMargin += item.grossMarginRate * normalizedProportion
      totalSales += sales
      totalCost += cost
      totalGrossProfit += grossProfit
      item.salesProportion = normalizedProportion
      item.salesAmount = sales
      item.weightedContribution = item.grossMarginRate * normalizedProportion
    })
  } else {
    // relative sales mode
    const rawSales = allItems.map((item) => ({
      item,
      rawSales: Math.max(0, Number(item.proportion || 0)) * item.price
    }))
    const rawSalesSum = rawSales.reduce((sum, { rawSales }) => sum + rawSales, 0)
    rawSales.forEach(({ item, rawSales }) => {
      const proportion = rawSalesSum > 0 ? rawSales / rawSalesSum : 0
      const sales = item.price * proportion
      const cost = item.cost * proportion
      const grossProfit = sales - cost
      weightedMargin += item.grossMarginRate * proportion
      totalSales += sales
      totalCost += cost
      totalGrossProfit += grossProfit
      item.salesProportion = proportion
      item.salesAmount = sales
      item.weightedContribution = item.grossMarginRate * proportion
      item.relativeSales = Number(item.proportion || 0)
    })
  }

  return {
    // 整体毛利率 = Σ(单品毛利率 × 销售额占比)，即各项加权贡献之和
    overallGrossMarginRate: weightedMargin,
    totalSales,
    totalCost,
    totalGrossProfit,
    items: allItems
  }
}

/** 校验名称是否合法 */
export function validateName(name) {
  return String(name || '').trim().length > 0
}

/** 计算所有单品映射表 */
export function buildDishesMap(dishes) {
  return new Map(dishes.map((d) => [d.id, d]))
}

/** 计算所有套餐映射表 */
export function buildCombosMap(combos) {
  return new Map(combos.map((c) => [c.id, c]))
}
