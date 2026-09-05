<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useStorage } from '@vueuse/core'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import {
  createIngredient,
  createDish,
  createCombo,
  createComboItem,
  createProfile,
  calculateDish,
  calculateCombo,
  calculateOverall,
  buildDishesMap,
  buildCombosMap,
  validateName
} from '../../logic/menuGrossMargin.js'
import { useToast } from '../../composables/useToast.js'

const toast = useToast()
const router = useRouter()

/** 所有菜单方案，默认至少一个 */
const profiles = useStorage('mgm-profiles', [createProfile('默认菜单')])

/** 当前选中的方案 ID */
const currentProfileId = useStorage('mgm-current-profile-id', '')

/** 初始化当前方案 */
if (!profiles.value.length) {
  profiles.value = [createProfile('默认菜单')]
}
if (!currentProfileId.value || !profiles.value.find((p) => p.id === currentProfileId.value)) {
  currentProfileId.value = profiles.value[0].id
}

const currentProfile = computed(() => profiles.value.find((p) => p.id === currentProfileId.value) || profiles.value[0])

/** 当前方案的单品列表（响应式引用） */
const dishes = computed({
  get: () => currentProfile.value.dishes,
  set: (val) => { currentProfile.value.dishes = val }
})

/** 当前方案的套餐列表 */
const combos = computed({
  get: () => currentProfile.value.combos,
  set: (val) => { currentProfile.value.combos = val }
})

/** 计算后的单品映射 */
const dishesMap = computed(() => buildDishesMap(dishes.value))
const combosMap = computed(() => buildCombosMap(combos.value))

/** 计算后的单品 */
const calculatedDishes = computed(() => dishes.value.map((d) => calculateDish(d)))
const validDishes = computed(() => calculatedDishes.value.filter((d) => d.valid && d.price > 0))

/** 计算后的套餐 */
const calculatedCombos = computed(() => combos.value.map((c) => calculateCombo(c, dishesMap.value)))
const validCombos = computed(() => calculatedCombos.value.filter((c) => c.valid))

/** 整体菜单毛利率计算结果 */
const overallResult = computed(() => calculateOverall(currentProfile.value, dishesMap.value, combosMap.value))

/** 切换方案 */
function switchProfile(id) {
  currentProfileId.value = id
}

/** 新建方案 */
function createNewProfile(fromCurrent = true) {
  const name = window.prompt('请输入新方案名称', '')
  if (!name || !validateName(name)) {
    toast.warn('方案名称不能为空')
    return
  }
  const newProfile = fromCurrent
    ? createProfile(name, JSON.parse(JSON.stringify(dishes.value)), JSON.parse(JSON.stringify(combos.value)), {
        proportionMode: currentProfile.value.proportionMode,
        dishProportions: { ...currentProfile.value.dishProportions },
        comboProportions: { ...currentProfile.value.comboProportions },
        includeCombosInOverall: currentProfile.value.includeCombosInOverall
      })
    : createProfile(name)
  profiles.value = [...profiles.value, newProfile]
  currentProfileId.value = newProfile.id
  toast.success(`已创建方案「${name}」`)
}

/** 重命名方案 */
function renameProfile() {
  const name = window.prompt('请输入新的方案名称', currentProfile.value.name)
  if (name === null) return
  if (!validateName(name)) {
    toast.warn('方案名称不能为空')
    return
  }
  currentProfile.value.name = name
}

/** 删除方案 */
function deleteProfile(id) {
  if (profiles.value.length <= 1) {
    toast.warn('至少保留一个方案')
    return
  }
  const target = profiles.value.find((p) => p.id === id)
  if (!target) return
  if (!window.confirm(`确定删除方案「${target.name}」吗？`)) return
  const remaining = profiles.value.filter((p) => p.id !== id)
  profiles.value = remaining
  if (currentProfileId.value === id) {
    currentProfileId.value = remaining[0].id
  }
  toast.success('方案已删除')
}

/** 加载示例数据 */
function loadExample() {
  if (!window.confirm('加载示例会替换当前方案中的所有单品和套餐，是否继续？')) return
  const dish1 = createDish('牛肉饭', 28, [
    createIngredient('牛肉', 10),
    createIngredient('米饭', 1),
    createIngredient('配菜', 1)
  ])
  const dish2 = createDish('尖椒鸡蛋盖饭', 18, [
    createIngredient('鸡蛋', 3),
    createIngredient('尖椒', 2),
    createIngredient('米饭', 1)
  ])
  const dish3 = createDish('凉拌黄瓜', 8, [
    createIngredient('黄瓜', 1),
    createIngredient('调料', 1)
  ])
  const combo1 = createCombo('招牌双人餐', 58, [
    createComboItem(dish1.id, 2),
    createComboItem(dish3.id, 1)
  ])
  dishes.value = [dish1, dish2, dish3]
  combos.value = [combo1]
  currentProfile.value.dishProportions = { [dish1.id]: 50, [dish2.id]: 30, [dish3.id]: 20 }
  currentProfile.value.comboProportions = {}
  currentProfile.value.proportionMode = 'percentage'
  currentProfile.value.includeCombosInOverall = false
  toast.success('示例数据已加载')
}

/** 清空当前方案 */
function clearAll() {
  if (!window.confirm('确定清空当前方案的所有单品、套餐和销量占比吗？')) return
  dishes.value = [createDish()]
  combos.value = []
  currentProfile.value.dishProportions = {}
  currentProfile.value.comboProportions = {}
  toast.success('已清空当前方案')
}

/** 添加单品 */
function addDish() {
  dishes.value = [...dishes.value, createDish()]
  nextTick(() => {
    const inputs = document.querySelectorAll('.dish-name-input')
    const last = inputs[inputs.length - 1]
    if (last) last.focus()
  })
}

/** 删除单品 */
function removeDish(index) {
  if (!window.confirm('确定删除该单品吗？')) return
  const dish = dishes.value[index]
  dishes.value = dishes.value.filter((_, i) => i !== index)
  // 清理已删除单品的销量占比
  const newProportions = { ...currentProfile.value.dishProportions }
  delete newProportions[dish.id]
  currentProfile.value.dishProportions = newProportions
  // 清理套餐中引用的该单品
  combos.value = combos.value.map((combo) => ({
    ...combo,
    items: combo.items.filter((item) => item.dishId !== dish.id)
  })).filter((combo) => combo.items.length > 0)
}

/** 添加原材料 */
function addIngredient(dish) {
  dish.ingredients = [...dish.ingredients, createIngredient()]
}

/** 删除原材料 */
function removeIngredient(dish, ingIndex) {
  if (dish.ingredients.length <= 1) {
    toast.info('至少保留一条原材料')
    return
  }
  dish.ingredients = dish.ingredients.filter((_, i) => i !== ingIndex)
}

/** 添加套餐 */
function addCombo() {
  combos.value = [...combos.value, createCombo()]
}

/** 删除套餐 */
function removeCombo(index) {
  if (!window.confirm('确定删除该套餐吗？')) return
  const combo = combos.value[index]
  combos.value = combos.value.filter((_, i) => i !== index)
  const newProportions = { ...currentProfile.value.comboProportions }
  delete newProportions[combo.id]
  currentProfile.value.comboProportions = newProportions
}

/** 添加套餐项 */
function addComboItem(combo) {
  const firstDish = dishes.value[0]
  combo.items = [...combo.items, createComboItem(firstDish?.id)]
}

/** 删除套餐项 */
function removeComboItem(combo, itemIndex) {
  if (combo.items.length <= 1) {
    toast.info('至少保留一个单品')
    return
  }
  combo.items = combo.items.filter((_, i) => i !== itemIndex)
}

/** 格式化金额 */
function fmtMoney(value) {
  return Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

/** 格式化百分比 */
function fmtPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`
}

/** 更新销量占比 */
function updateProportion(itemId, value) {
  const num = Math.max(0, Number(value) || 0)
  if (currentProfile.value.proportionMode === 'percentage') {
    currentProfile.value.dishProportions = { ...currentProfile.value.dishProportions, [itemId]: Math.min(100, num) }
  } else {
    currentProfile.value.dishProportions = { ...currentProfile.value.dishProportions, [itemId]: num }
  }
}

function updateComboProportion(comboId, value) {
  const num = Math.max(0, Number(value) || 0)
  if (currentProfile.value.proportionMode === 'percentage') {
    currentProfile.value.comboProportions = { ...currentProfile.value.comboProportions, [comboId]: Math.min(100, num) }
  } else {
    currentProfile.value.comboProportions = { ...currentProfile.value.comboProportions, [comboId]: num }
  }
}

/** 归一化百分比 */
function normalizePercentages() {
  const items = overallResult.value.items
  const total = items.reduce((sum, item) => sum + Number(item.proportion || 0), 0)
  if (total === 0) {
    toast.warn('当前没有可归一化的销量占比')
    return
  }
  const newDishProportions = { ...currentProfile.value.dishProportions }
  const newComboProportions = { ...currentProfile.value.comboProportions }
  items.forEach((item) => {
    const normalized = (Number(item.proportion || 0) / total) * 100
    if (item.type === 'dish') {
      newDishProportions[item.id] = Number(normalized.toFixed(2))
    } else {
      newComboProportions[item.id] = Number(normalized.toFixed(2))
    }
  })
  currentProfile.value.dishProportions = newDishProportions
  currentProfile.value.comboProportions = newComboProportions
  toast.success('已归一化为 100%')
}

/** 导出 Excel */
function exportExcel() {
  const wb = XLSX.utils.book_new()

  // Sheet 1: 单品
  const dishRows = [['单品名称', '售价', '成本', '毛利', '毛利率']]
  calculatedDishes.value.forEach((d) => {
    dishRows.push([
      d.name || '(未命名)',
      d.price,
      d.cost,
      d.grossProfit,
      d.price > 0 ? d.grossProfit / d.price : 0
    ])
  })
  const wsDishes = XLSX.utils.aoa_to_sheet(dishRows)
  XLSX.utils.book_append_sheet(wb, wsDishes, '单品毛利率')

  // Sheet 2: 套餐
  const comboRows = [['套餐名称', '包含单品', '套餐售价', '单品原价合计', '折扣率', '成本', '毛利', '毛利率']]
  calculatedCombos.value.forEach((c) => {
    comboRows.push([
      c.name || '(未命名)',
      c.items.map((item) => `${item.dishName || '(已删除)'}×${item.quantity}`).join('、'),
      c.price,
      c.originalPrice,
      c.originalPrice > 0 ? c.price / c.originalPrice : 0,
      c.cost,
      c.grossProfit,
      c.price > 0 ? c.grossProfit / c.price : 0
    ])
  })
  const wsCombos = XLSX.utils.aoa_to_sheet(comboRows)
  XLSX.utils.book_append_sheet(wb, wsCombos, '套餐毛利率')

  // Sheet 3: 整体菜单汇总
  const summaryRows = [
    ['整体菜单毛利率', overallResult.value.overallGrossMarginRate],
    ['菜单总销售额', overallResult.value.totalSales],
    ['菜单总成本', overallResult.value.totalCost],
    ['菜单总毛利', overallResult.value.totalGrossProfit],
    [],
    ['名称', '类型', '销售额占比', '加权贡献']
  ]
  overallResult.value.items.forEach((item) => {
    summaryRows.push([
      item.name || '(未命名)',
      item.type === 'dish' ? '单品' : '套餐',
      item.salesProportion,
      item.weightedContribution
    ])
  })
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  XLSX.utils.book_append_sheet(wb, wsSummary, '整体菜单汇总')

  const fileName = `${currentProfile.value.name || '菜单毛利率'}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, fileName)
  toast.success('Excel 导出成功')
}

/** 下载结果图片 */
function downloadImage() {
  const width = 520
  const padding = 24
  const lineHeight = 26
  const headerHeight = 64
  const dpr = Math.max(window.devicePixelRatio || 1, 2)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rows = [
    ['方案名称', currentProfile.value.name],
    ['单品数量', `${dishes.value.length} 个`],
    ['套餐数量', `${combos.value.length} 个`],
    ['整体菜单毛利率', fmtPercent(overallResult.value.overallGrossMarginRate)],
    ['菜单总销售额', `${fmtMoney(overallResult.value.totalSales)} 元`],
    ['菜单总成本', `${fmtMoney(overallResult.value.totalCost)} 元`],
    ['菜单总毛利', `${fmtMoney(overallResult.value.totalGrossProfit)} 元`]
  ]

  const contentHeight = headerHeight + rows.length * lineHeight + 80
  canvas.width = width * dpr
  canvas.height = contentHeight * dpr
  canvas.style.width = `${width}px`
  ctx.scale(dpr, dpr)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, contentHeight)

  ctx.fillStyle = '#f59e0b'
  ctx.fillRect(0, 0, width, headerHeight)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('📊 菜单毛利率测算', width / 2, headerHeight / 2 - 10)
  ctx.font = '11px sans-serif'
  ctx.fillText(`生成时间：${new Date().toLocaleString('zh-CN')}`, width / 2, headerHeight / 2 + 14)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#374151'
  ctx.font = '13px sans-serif'

  let y = headerHeight + 20
  rows.forEach(([label, value]) => {
    ctx.fillStyle = '#6b7280'
    ctx.fillText(`${label}：`, padding, y)
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(String(value), padding + 120, y)
    ctx.font = '13px sans-serif'
    y += lineHeight
  })

  y += 20
  ctx.fillStyle = '#9ca3af'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('数据基于录入成本计算，仅供参考', width / 2, y)

  const link = document.createElement('a')
  link.download = `${currentProfile.value.name || '菜单毛利率'}_${new Date().toISOString().slice(0, 10)}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
  toast.success('图片已保存')
}

/** 回填到餐饮盈利计算器 */
function fillToRestaurantProfit() {
  const gm = overallResult.value.overallGrossMarginRate
  localStorage.setItem('rpf-gross-margin', String(gm))
  router.push('/tools/restaurant-profit')
  toast.success(`已将整体毛利率 ${fmtPercent(gm)} 回填到餐饮盈利计算器`)
}

/** 单品被删除后，清理套餐中引用的失效单品 */
watch(
  () => dishes.value.map((d) => d.id),
  (newIds, oldIds) => {
    if (!oldIds) return
    const removed = oldIds.filter((id) => !newIds.includes(id))
    if (!removed.length) return
    const removedSet = new Set(removed)
    combos.value = combos.value
      .map((combo) => ({
        ...combo,
        items: combo.items.filter((item) => !removedSet.has(item.dishId))
      }))
      .filter((combo) => combo.items.length > 0)
  }
)
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>📋 餐饮菜单毛利率计算器</h1>
      <p class="tool-desc">拆分单品成本、设计套餐定价、测算整体菜单毛利率，支持多方案管理与 Excel 导出。</p>
    </div>

    <div class="tool-layout">
      <!-- 左侧输入区 -->
      <div class="input-panel">
        <!-- 方案管理 -->
        <div class="section-title">方案管理</div>
        <div class="profile-bar">
          <select v-model="currentProfileId" class="select profile-select">
            <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <button class="btn btn-sm" @click="renameProfile">重命名</button>
          <button class="btn btn-sm" @click="() => createNewProfile(true)">复制</button>
          <button class="btn btn-sm" @click="() => createNewProfile(false)">新建</button>
          <button class="btn btn-sm btn-danger" @click="() => deleteProfile(currentProfileId)">删除</button>
        </div>

        <!-- 操作按钮 -->
        <div class="action-bar">
          <button class="btn btn-secondary" @click="loadExample">加载示例</button>
          <button class="btn btn-secondary" @click="clearAll">清空全部</button>
        </div>

        <!-- 单品管理 -->
        <div class="section-title">单品管理</div>
        <div class="dish-list">
          <div v-for="(dish, index) in dishes" :key="dish.id" class="dish-card">
            <div class="card-header">
              <input v-model="dish.name" type="text" class="input dish-name-input" placeholder="单品名称">
              <button class="btn-icon" @click="removeDish(index)">✕</button>
            </div>
            <div class="form-row form-row-2col">
              <div class="form-col">
                <label>售价（元）</label>
                <input v-model.number="dish.price" type="number" min="0" class="input" placeholder="0">
              </div>
              <div class="form-col">
                <label>单品毛利率</label>
                <div class="readonly-value">{{ fmtPercent(calculatedDishes[index]?.grossMarginRate) }}</div>
              </div>
            </div>
            <div class="ingredients-section">
              <div class="ingredients-header">
                <span>原材料</span>
                <span class="cost-total">成本合计 {{ fmtMoney(calculatedDishes[index]?.cost) }} 元</span>
              </div>
              <div v-for="(ing, ingIndex) in dish.ingredients" :key="ing.id" class="ingredient-row">
                <input v-model="ing.name" type="text" class="input" placeholder="名称">
                <input v-model.number="ing.cost" type="number" min="0" class="input" placeholder="成本">
                <button class="btn-icon" @click="removeIngredient(dish, ingIndex)">✕</button>
              </div>
              <button class="btn btn-sm btn-link" @click="addIngredient(dish)">+ 添加原材料</button>
            </div>
          </div>
        </div>
        <button class="btn btn-primary add-dish-btn" @click="addDish">+ 添加单品</button>

        <!-- 套餐管理 -->
        <div class="section-title">套餐管理</div>
        <div v-if="!combos.length" class="empty-tip">暂无套餐，点击下方按钮添加</div>
        <div class="combo-list">
          <div v-for="(combo, index) in combos" :key="combo.id" class="combo-card">
            <div class="card-header">
              <input v-model="combo.name" type="text" class="input combo-name-input" placeholder="套餐名称">
              <button class="btn-icon" @click="removeCombo(index)">✕</button>
            </div>
            <div class="form-row form-row-3col">
              <div class="form-col">
                <label>套餐售价（元）</label>
                <input v-model.number="combo.price" type="number" min="0" class="input">
              </div>
              <div class="form-col">
                <label>单品原价合计</label>
                <div class="readonly-value">{{ fmtMoney(calculatedCombos[index]?.originalPrice) }}</div>
              </div>
              <div class="form-col">
                <label>套餐毛利率</label>
                <div class="readonly-value">{{ fmtPercent(calculatedCombos[index]?.grossMarginRate) }}</div>
              </div>
            </div>
            <div v-if="calculatedCombos[index]?.discountRate > 0" class="combo-discount">
              折扣率 {{ fmtPercent(calculatedCombos[index]?.discountRate) }}
            </div>
            <div class="combo-items-section">
              <div class="combo-items-header">包含单品</div>
              <div v-for="(item, itemIndex) in combo.items" :key="`${combo.id}-${itemIndex}`" class="combo-item-row">
                <select v-model="item.dishId" class="select">
                  <option v-for="d in dishes" :key="d.id" :value="d.id">{{ d.name || '(未命名)' }}</option>
                </select>
                <input v-model.number="item.quantity" type="number" min="1" class="input input-quantity" placeholder="份数">
                <button class="btn-icon" @click="removeComboItem(combo, itemIndex)">✕</button>
              </div>
              <button class="btn btn-sm btn-link" @click="addComboItem(combo)">+ 添加单品</button>
            </div>
          </div>
        </div>
        <button class="btn btn-primary add-combo-btn" @click="addCombo">+ 添加套餐</button>
      </div>

      <!-- 右侧结果区 -->
      <div class="result-panel">
        <div class="result-card">
          <div class="result-card-header">
            <h3>整体菜单毛利率</h3>
            <div class="result-actions">
              <button class="btn btn-sm" @click="exportExcel">导出 Excel</button>
              <button class="btn btn-sm" @click="downloadImage">保存图片</button>
            </div>
          </div>
          <div class="result-big-number">{{ fmtPercent(overallResult.overallGrossMarginRate) }}</div>
          <div class="result-sub-numbers">
            <div class="sub-number">
              <span class="sub-label">菜单总销售额</span>
              <span class="sub-value">{{ fmtMoney(overallResult.totalSales) }} 元</span>
            </div>
            <div class="sub-number">
              <span class="sub-label">菜单总成本</span>
              <span class="sub-value">{{ fmtMoney(overallResult.totalCost) }} 元</span>
            </div>
            <div class="sub-number">
              <span class="sub-label">菜单总毛利</span>
              <span class="sub-value">{{ fmtMoney(overallResult.totalGrossProfit) }} 元</span>
            </div>
          </div>
        </div>

        <div class="result-card">
          <div class="section-title">销量占比设置</div>
          <div class="mode-toggle">
            <button class="mode-btn" :class="{ active: currentProfile.proportionMode === 'percentage' }" @click="currentProfile.proportionMode = 'percentage'">百分比</button>
            <button class="mode-btn" :class="{ active: currentProfile.proportionMode === 'relative' }" @click="currentProfile.proportionMode = 'relative'">相对销量</button>
          </div>
          <div class="proportion-list">
            <div v-for="dish in validDishes" :key="dish.id" class="proportion-row">
              <span class="proportion-name">{{ dish.name || '(未命名)' }}</span>
              <input :value="currentProfile.dishProportions[dish.id]" type="number" min="0" class="input input-proportion" @input="updateProportion(dish.id, $event.target.value)">
              <span class="proportion-unit">{{ currentProfile.proportionMode === 'percentage' ? '%' : '份' }}</span>
            </div>
            <div v-for="combo in validCombos" v-show="currentProfile.includeCombosInOverall" :key="combo.id" class="proportion-row">
              <span class="proportion-name">{{ combo.name || '(未命名)' }} <span class="combo-tag">套餐</span></span>
              <input :value="currentProfile.comboProportions[combo.id]" type="number" min="0" class="input input-proportion" @input="updateComboProportion(combo.id, $event.target.value)">
              <span class="proportion-unit">{{ currentProfile.proportionMode === 'percentage' ? '%' : '份' }}</span>
            </div>
          </div>
          <div v-if="currentProfile.proportionMode === 'percentage'" class="proportion-summary">
            当前占比合计：{{ fmtPercent(overallResult.items.reduce((sum, item) => sum + Number(item.proportion || 0), 0) / 100) }}
            <button v-if="Math.abs(overallResult.items.reduce((sum, item) => sum + Number(item.proportion || 0), 0) - 100) > 0.01" class="btn btn-sm btn-link" @click="normalizePercentages">一键归一</button>
          </div>
          <div class="include-combos-row">
            <label class="checkbox-label">
              <input v-model="currentProfile.includeCombosInOverall" type="checkbox">
              套餐参与整体菜单毛利率计算
            </label>
          </div>
        </div>

        <div class="result-card">
          <div class="section-title">各单品贡献</div>
          <table class="data-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>类型</th>
                <th>毛利率</th>
                <th>销售占比</th>
                <th>加权贡献</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in overallResult.items" :key="item.id">
                <td>{{ item.name || '(未命名)' }}</td>
                <td><span class="type-tag" :class="item.type">{{ item.type === 'dish' ? '单品' : '套餐' }}</span></td>
                <td>{{ fmtPercent(item.grossMarginRate) }}</td>
                <td>{{ fmtPercent(item.salesProportion) }}</td>
                <td>{{ fmtPercent(item.weightedContribution) }}</td>
              </tr>
              <tr v-if="!overallResult.items.length">
                <td colspan="5" class="empty-cell">暂无数据，请添加单品并设置销量占比</td>
              </tr>
            </tbody>
          </table>
        </div>

        <button class="btn btn-primary btn-block" @click="fillToRestaurantProfit">将整体毛利率回填到餐饮盈利计算器</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.tool-header {
  margin-bottom: 24px;
}

.tool-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.tool-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.tool-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
}

@media (max-width: 900px) {
  .tool-layout {
    grid-template-columns: 1fr;
  }
}

.input-panel,
.result-panel {
  background: var(--bg-primary);
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 20px;
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

.profile-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.profile-select {
  flex: 1;
  min-width: 120px;
}

.action-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.dish-list,
.combo-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dish-card,
.combo-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  background: var(--bg-secondary);
}

.card-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.dish-name-input,
.combo-name-input {
  flex: 1;
  font-weight: 600;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.form-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-row-3col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-col label {
  font-size: 12px;
  color: var(--text-secondary);
}

.input,
.select {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.input:focus,
.select:focus {
  outline: none;
  border-color: var(--accent);
}

.readonly-value {
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  min-height: 35px;
  display: flex;
  align-items: center;
}

.ingredients-section,
.combo-items-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}

.ingredients-header,
.combo-items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.cost-total {
  color: var(--text-primary);
  font-weight: 500;
}

.ingredient-row,
.combo-item-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.ingredient-row .input:first-child,
.combo-item-row .select {
  flex: 1;
}

.ingredient-row .input:nth-child(2),
.combo-item-row .input-quantity {
  width: 80px;
}

.btn-danger {
  background: #ef4444;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-link {
  background: transparent;
  color: var(--accent);
  padding: 4px 0;
  justify-content: flex-start;
}

.btn-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
}

.btn-icon:hover {
  background: #fee2e2;
  color: #ef4444;
}

.add-dish-btn,
.add-combo-btn {
  width: 100%;
  margin-top: 12px;
}

.empty-tip {
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 8px;
}

.combo-discount {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.result-card {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}

.result-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-card-header h3 {
  font-size: 16px;
  margin: 0;
  color: var(--text-primary);
}

.result-actions {
  display: flex;
  gap: 8px;
}

.result-big-number {
  font-size: 36px;
  font-weight: 700;
  color: var(--accent);
  text-align: center;
  margin: 16px 0;
}

.result-sub-numbers {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.sub-number {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.sub-number:last-child {
  border-bottom: none;
}

.sub-label {
  color: var(--text-secondary);
  font-size: 13px;
}

.sub-value {
  font-weight: 600;
  color: var(--text-primary);
}

.mode-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.mode-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
}

.mode-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.proportion-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.proportion-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.proportion-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
}

.proportion-name .combo-tag {
  font-size: 11px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  padding: 2px 4px;
  border-radius: 4px;
  margin-left: 4px;
}

.input-proportion {
  width: 80px;
  text-align: right;
}

.proportion-unit {
  width: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

.proportion-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.include-combos-row {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  color: var(--text-secondary);
  font-weight: 500;
}

.type-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.type-tag.dish {
  background: #dbeafe;
  color: #2563eb;
}

.type-tag.combo {
  background: #fef3c7;
  color: #d97706;
}

.empty-cell {
  text-align: center;
  color: var(--text-muted);
  padding: 16px;
}

.btn-block {
  width: 100%;
  margin-top: 8px;
}
</style>
