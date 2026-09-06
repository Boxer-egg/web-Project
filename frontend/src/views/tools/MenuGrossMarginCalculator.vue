<script setup>
import { ref, computed, watch } from 'vue'
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
  buildCombosMap
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

/** 当前方案的单品/套餐列表 */
const dishes = computed({
  get: () => currentProfile.value.dishes,
  set: (val) => { currentProfile.value.dishes = val }
})
const combos = computed({
  get: () => currentProfile.value.combos,
  set: (val) => { currentProfile.value.combos = val }
})

const dishesMap = computed(() => buildDishesMap(dishes.value))
const combosMap = computed(() => buildCombosMap(combos.value))

/** 计算结果 */
const calculatedDishes = computed(() => dishes.value.map((d) => calculateDish(d)))
const validDishes = computed(() => calculatedDishes.value.filter((d) => d.valid && d.price > 0))
const calculatedCombos = computed(() => combos.value.map((c) => calculateCombo(c, dishesMap.value)))
const validCombos = computed(() => calculatedCombos.value.filter((c) => c.valid))
const overallResult = computed(() => calculateOverall(currentProfile.value, dishesMap.value, combosMap.value))

/** ========== 单品录入框（单条录入） ========== */
const emptyDishForm = () => ({
  id: null,
  name: '',
  price: 0,
  ingredients: [createIngredient()]
})
const dishForm = ref(emptyDishForm())

/** 单品录入实时预估：按已填原材料逐项求和成本，与售价对比算出毛利/毛利率 */
const dishPreview = computed(() => {
  const filled = dishForm.value.ingredients.filter(
    (ing) => (ing.name && ing.name.trim()) || Number(ing.cost) > 0
  )
  const cost = filled.reduce((sum, ing) => sum + (Number(ing.cost) || 0), 0)
  const price = Math.max(0, Number(dishForm.value.price) || 0)
  const grossProfit = price > 0 ? price - cost : null
  const rate = price > 0 ? (price - cost) / price : null
  return { count: filled.length, cost, price, grossProfit, rate }
})

/** 实时预估是否达到可展示状态：至少填了一条原材料或售价 */
const dishPreviewVisible = computed(() => dishPreview.value.count > 0 || dishPreview.value.price > 0)

/** 实时毛利率文案：售价未填显示 — */
const dishPreviewRateText = computed(() =>
  dishPreview.value.rate == null ? '—' : fmtPercent(dishPreview.value.rate)
)

function isDishFormDirty() {
  const f = dishForm.value
  return Boolean(
    (f.name && f.name.trim()) ||
    Number(f.price) > 0 ||
    f.ingredients.some((ing) => (ing.name && ing.name.trim()) || Number(ing.cost) > 0)
  )
}

/** 点击菜单中的单品名称，回填到录入框 */
function fillDishForm(dish) {
  if (dishForm.value.id === dish.id) return
  if (isDishFormDirty() && !window.confirm('单品录入框已有数据，是否覆盖？')) return
  dishForm.value = {
    id: dish.id,
    name: dish.name,
    price: dish.price,
    ingredients: dish.ingredients.length
      ? dish.ingredients.map((ing) => ({ ...ing }))
      : [createIngredient()]
  }
}

/** 重置单品录入框 */
function resetDishForm() {
  dishForm.value = emptyDishForm()
}

/** 加入菜单：编辑态更新原单品，否则新增 */
function addDishToMenu() {
  const f = dishForm.value
  if (!f.name || !f.name.trim()) {
    toast.warn('请填写单品名称')
    return
  }
  const ingredients = f.ingredients
    .filter((ing) => (ing.name && ing.name.trim()) || Number(ing.cost) > 0)
    .map((ing) => ({ ...ing, name: ing.name.trim(), cost: Math.max(0, Number(ing.cost) || 0) }))
  if (!ingredients.length) {
    toast.warn('请至少填写一条原材料')
    return
  }
  const price = Math.max(0, Number(f.price) || 0)
  if (f.id && dishesMap.value.has(f.id)) {
    dishes.value = dishes.value.map((d) =>
      d.id === f.id ? { ...d, name: f.name.trim(), price, ingredients } : d
    )
    toast.success(`已更新单品「${f.name.trim()}」`)
  } else {
    const dish = createDish(f.name.trim(), price, ingredients)
    dishes.value = [...dishes.value, dish]
    toast.success(`已加入菜单：「${dish.name}」`)
  }
  resetDishForm()
}

/** ========== 套餐录入框（单条录入） ========== */
const emptyComboForm = () => ({
  id: null,
  name: '',
  price: 0,
  items: [createComboItem(dishes.value[0]?.id || '', 1)]
})
const comboForm = ref(emptyComboForm())

function isComboFormDirty() {
  const f = comboForm.value
  return Boolean(
    (f.name && f.name.trim()) ||
    Number(f.price) > 0 ||
    f.items.some((it) => it.dishId && Number(it.quantity) > 0)
  )
}

/** 点击套餐名称，回填到套餐录入框 */
function fillComboForm(combo) {
  if (comboForm.value.id === combo.id) return
  if (isComboFormDirty() && !window.confirm('套餐录入框已有数据，是否覆盖？')) return
  comboForm.value = {
    id: combo.id,
    name: combo.name,
    price: combo.price,
    items: combo.items.length
      ? combo.items.map((it) => ({ ...it }))
      : [createComboItem(dishes.value[0]?.id || '', 1)]
  }
}

function resetComboForm() {
  comboForm.value = emptyComboForm()
}

/** 加入菜单：编辑态更新原套餐，否则新增 */
function addComboToMenu() {
  const f = comboForm.value
  if (!f.name || !f.name.trim()) {
    toast.warn('请填写套餐名称')
    return
  }
  const items = f.items
    .filter((it) => it.dishId && dishesMap.value.has(it.dishId))
    .map((it) => ({ dishId: it.dishId, quantity: Math.max(1, Number(it.quantity) || 1) }))
  if (!items.length) {
    toast.warn('请至少选择一个有效单品')
    return
  }
  const price = Math.max(0, Number(f.price) || 0)
  if (f.id && combosMap.value.has(f.id)) {
    combos.value = combos.value.map((c) =>
      c.id === f.id ? { ...c, name: f.name.trim(), price, items } : c
    )
    toast.success(`已更新套餐「${f.name.trim()}」`)
  } else {
    const combo = createCombo(f.name.trim(), price, items)
    combos.value = [...combos.value, combo]
    toast.success(`已加入菜单：「${combo.name}」`)
  }
  resetComboForm()
}

/** ========== 菜单概览操作 ========== */
function removeDishById(id) {
  const dish = dishesMap.value.get(id)
  if (!dish) return
  if (!window.confirm(`确定从菜单中删除「${dish.name || '未命名'}」吗？`)) return
  dishes.value = dishes.value.filter((d) => d.id !== id)
  const newProportions = { ...currentProfile.value.dishProportions }
  delete newProportions[id]
  currentProfile.value.dishProportions = newProportions
  combos.value = combos.value
    .map((combo) => ({ ...combo, items: combo.items.filter((item) => item.dishId !== id) }))
    .filter((combo) => combo.items.length > 0)
  if (dishForm.value.id === id) resetDishForm()
  toast.success('已从菜单删除')
}

function removeComboById(id) {
  const combo = combosMap.value.get(id)
  if (!combo) return
  if (!window.confirm(`确定删除套餐「${combo.name || '未命名'}」吗？`)) return
  combos.value = combos.value.filter((c) => c.id !== id)
  const newProportions = { ...currentProfile.value.comboProportions }
  delete newProportions[id]
  currentProfile.value.comboProportions = newProportions
  if (comboForm.value.id === id) resetComboForm()
  toast.success('套餐已删除')
}

/** ========== 方案管理 ========== */
function createNewProfile(fromCurrent = true) {
  const name = window.prompt('请输入新方案名称', '')
  if (!name || !name.trim()) {
    toast.warn('方案名称不能为空')
    return
  }
  const newProfile = fromCurrent
    ? createProfile(name.trim(), JSON.parse(JSON.stringify(dishes.value)), JSON.parse(JSON.stringify(combos.value)), {
        proportionMode: currentProfile.value.proportionMode,
        dishProportions: { ...currentProfile.value.dishProportions },
        comboProportions: { ...currentProfile.value.comboProportions },
        includeCombosInOverall: currentProfile.value.includeCombosInOverall
      })
    : createProfile(name.trim())
  profiles.value = [...profiles.value, newProfile]
  currentProfileId.value = newProfile.id
  resetDishForm()
  resetComboForm()
  toast.success(`已创建方案「${name.trim()}」`)
}

function renameProfile() {
  const name = window.prompt('请输入新的方案名称', currentProfile.value.name)
  if (name === null) return
  if (!name.trim()) {
    toast.warn('方案名称不能为空')
    return
  }
  currentProfile.value.name = name.trim()
}

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

/** ========== 示例与清空 ========== */
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
  resetDishForm()
  resetComboForm()
  toast.success('示例数据已加载')
}

function clearAll() {
  if (!window.confirm('确定清空当前方案的菜单、销量占比和录入框吗？')) return
  dishes.value = []
  combos.value = []
  currentProfile.value.dishProportions = {}
  currentProfile.value.comboProportions = {}
  resetDishForm()
  resetComboForm()
  toast.success('已清空当前方案')
}

/** ========== 录入框行操作 ========== */
function addFormIngredient() {
  dishForm.value.ingredients = [...dishForm.value.ingredients, createIngredient()]
}
function removeFormIngredient(index) {
  if (dishForm.value.ingredients.length <= 1) {
    toast.info('至少保留一条原材料')
    return
  }
  dishForm.value.ingredients = dishForm.value.ingredients.filter((_, i) => i !== index)
}
function addFormComboItem() {
  comboForm.value.items = [...comboForm.value.items, createComboItem(dishes.value[0]?.id || '', 1)]
}
function removeFormComboItem(index) {
  if (comboForm.value.items.length <= 1) {
    toast.info('至少保留一个单品')
    return
  }
  comboForm.value.items = comboForm.value.items.filter((_, i) => i !== index)
}

/** ========== 销量占比 ========== */
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
const proportionSum = computed(() =>
  overallResult.value.items.reduce((sum, item) => sum + Number(item.proportion || 0), 0)
)

/** ========== 导出 ========== */
function fmtMoney(value) {
  return Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}
function fmtPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`
}

function exportExcel() {
  const wb = XLSX.utils.book_new()

  const dishRows = [['单品名称', '售价', '成本', '毛利', '毛利率']]
  calculatedDishes.value.forEach((d) => {
    dishRows.push([d.name || '(未命名)', d.price, d.cost, d.grossProfit, d.price > 0 ? d.grossProfit / d.price : 0])
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dishRows), '单品毛利率')

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
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(comboRows), '套餐毛利率')

  const summaryRows = [
    ['整体菜单毛利率', overallResult.value.overallGrossMarginRate],
    ['菜单总销售额', overallResult.value.totalSales],
    ['菜单总成本', overallResult.value.totalCost],
    ['菜单总毛利', overallResult.value.totalGrossProfit],
    [],
    ['名称', '类型', '销售额占比', '加权贡献']
  ]
  overallResult.value.items.forEach((item) => {
    summaryRows.push([item.name || '(未命名)', item.type === 'dish' ? '单品' : '套餐', item.salesProportion, item.weightedContribution])
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), '整体菜单汇总')

  XLSX.writeFile(wb, `${currentProfile.value.name || '菜单毛利率'}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  toast.success('Excel 导出成功')
}

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
      <p class="tool-desc">单品录入原材料成本、套餐组合定价，加入菜单后自动测算整体毛利率，支持多方案管理与 Excel 导出。</p>
    </div>

    <div class="tool-layout">
      <!-- 左侧：录入区 -->
      <div class="input-panel">
        <!-- 方案管理 -->
        <div class="section-title">方案管理</div>
        <div class="profile-bar">
          <select v-model="currentProfileId" class="select profile-select" @change="resetDishForm(); resetComboForm()">
            <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <button class="btn btn-sm" @click="renameProfile">重命名</button>
          <button class="btn btn-sm" @click="() => createNewProfile(true)">复制</button>
          <button class="btn btn-sm" @click="() => createNewProfile(false)">新建</button>
          <button class="btn btn-sm btn-danger" @click="() => deleteProfile(currentProfileId)">删除</button>
        </div>

        <div class="action-bar">
          <button class="btn btn-secondary btn-sm" @click="loadExample">加载示例</button>
          <button class="btn btn-secondary btn-sm" @click="clearAll">清空全部</button>
        </div>

        <!-- 单品录入 -->
        <div class="section-title">单品录入</div>
        <div class="form-card">
          <div class="form-row form-row-2col">
            <div class="form-col">
              <label>单品名称</label>
              <input v-model="dishForm.name" type="text" class="input" placeholder="如：牛肉饭">
            </div>
            <div class="form-col">
              <label>售价（元）</label>
              <input v-model.number="dishForm.price" type="number" min="0" class="input" placeholder="0">
            </div>
          </div>
          <div class="form-ingredients">
            <div class="form-subheader">
              <span>原材料</span>
            </div>
            <div v-for="(ing, ingIndex) in dishForm.ingredients" :key="ing.id" class="ingredient-row">
              <input v-model="ing.name" type="text" class="input" placeholder="名称">
              <input v-model.number="ing.cost" type="number" min="0" class="input" placeholder="成本">
              <button class="btn-icon" @click="removeFormIngredient(ingIndex)">✕</button>
            </div>
            <button class="btn btn-sm btn-link" @click="addFormIngredient">+ 添加原材料</button>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" @click="addDishToMenu">{{ dishForm.id ? '更新菜单' : '加入菜单' }}</button>
            <button v-if="isDishFormDirty()" class="btn btn-secondary btn-sm" @click="resetDishForm">重置</button>
            <div class="dish-live-preview" :class="{ 'has-data': dishPreviewVisible }">
              <span v-if="!dishPreviewVisible" class="dlp-placeholder">填写原材料后实时预估毛利率</span>
              <template v-else>
                <span class="dlp-item">食材 <b>{{ dishPreview.count }}</b> 项</span>
                <span class="dlp-item">成本 <b>¥{{ fmtMoney(dishPreview.cost) }}</b></span>
                <span class="dlp-item">售价 <b>¥{{ fmtMoney(dishPreview.price) }}</b></span>
                <span class="dlp-item">毛利 <b :class="dishPreview.grossProfit != null && dishPreview.grossProfit < 0 ? 'negative' : ''">{{ dishPreview.grossProfit == null ? '—' : '¥' + fmtMoney(dishPreview.grossProfit) }}</b></span>
                <span class="dlp-rate" :class="{ negative: dishPreview.rate != null && dishPreview.rate < 0 }">
                  毛利率 {{ dishPreviewRateText }}
                </span>
              </template>
            </div>
          </div>
        </div>

        <!-- 套餐录入 -->
        <div class="section-title">套餐录入</div>
        <div class="form-card">
          <div class="form-row form-row-2col">
            <div class="form-col">
              <label>套餐名称</label>
              <input v-model="comboForm.name" type="text" class="input" placeholder="如：招牌双人餐">
            </div>
            <div class="form-col">
              <label>套餐售价（元）</label>
              <input v-model.number="comboForm.price" type="number" min="0" class="input" placeholder="0">
            </div>
          </div>
          <div class="form-ingredients">
            <div class="form-subheader"><span>包含单品</span></div>
            <div v-for="(item, itemIndex) in comboForm.items" :key="itemIndex" class="ingredient-row">
              <select v-model="item.dishId" class="select">
                <option v-for="d in dishes" :key="d.id" :value="d.id">{{ d.name || '(未命名)' }}</option>
              </select>
              <input v-model.number="item.quantity" type="number" min="1" class="input input-quantity" placeholder="份数">
              <button class="btn-icon" @click="removeFormComboItem(itemIndex)">✕</button>
            </div>
            <button class="btn btn-sm btn-link" @click="addFormComboItem">+ 添加单品</button>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" @click="addComboToMenu">{{ comboForm.id ? '更新菜单' : '加入菜单' }}</button>
            <button v-if="isComboFormDirty()" class="btn btn-secondary btn-sm" @click="resetComboForm">重置</button>
          </div>
        </div>
      </div>

      <!-- 右侧：结果区 -->
      <div class="result-panel">
        <!-- 菜单概览 -->
        <div class="result-card">
          <div class="section-title tight">菜单概览</div>
          <div v-if="!dishes.length && !combos.length" class="empty-tip">菜单为空，请在左侧录入单品或套餐后点击「加入菜单」</div>
          <div v-if="dishes.length" class="overview-group">
            <div class="overview-group-title">单品（{{ dishes.length }}）</div>
            <div v-for="d in calculatedDishes" :key="d.id" class="overview-row">
              <button class="overview-name" @click="fillDishForm(dishesMap.get(d.id))">{{ d.name || '(未命名)' }}</button>
              <span class="overview-stat">售价 {{ fmtMoney(d.price) }}</span>
              <span class="overview-stat">成本 {{ fmtMoney(d.cost) }}</span>
              <span class="overview-stat strong" :class="{ warn: d.grossMarginRate < 0.3 }">毛利率 {{ d.price > 0 ? fmtPercent(d.grossMarginRate) : '—' }}</span>
              <button class="btn-icon" @click="removeDishById(d.id)">✕</button>
            </div>
          </div>
          <div v-if="combos.length" class="overview-group">
            <div class="overview-group-title">套餐（{{ combos.length }}）</div>
            <div v-for="c in calculatedCombos" :key="c.id" class="overview-item">
              <div class="overview-row">
                <button class="overview-name combo" @click="fillComboForm(combosMap.get(c.id))">{{ c.name || '(未命名)' }}</button>
                <span class="overview-stat">售价 {{ fmtMoney(c.price) }}</span>
                <span class="overview-stat">成本 {{ fmtMoney(c.cost) }}</span>
                <span class="overview-stat strong">毛利率 {{ c.price > 0 ? fmtPercent(c.grossMarginRate) : '—' }}</span>
                <button class="btn-icon" @click="removeComboById(c.id)">✕</button>
              </div>
              <div class="combo-detail">
                <span v-if="!c.items.length" class="combo-detail-empty">暂无有效单品，请重新编辑套餐</span>
                <template v-for="(item, idx) in c.items" :key="item.dishId + '-' + idx">
                  <span class="combo-detail-chip">
                    <span class="cd-dish">{{ item.dishName || '(已删除)' }}</span>
                    <span class="cd-qty">×{{ item.quantity }}</span>
                    <span class="cd-price">¥{{ fmtMoney(item.dishPrice) }}/份</span>
                  </span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 整体菜单毛利率 -->
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

        <!-- 销量占比设置 -->
        <div class="result-card">
          <div class="section-title tight">销量占比设置</div>
          <div class="mode-toggle">
            <button class="mode-btn" :class="{ active: currentProfile.proportionMode === 'percentage' }" @click="currentProfile.proportionMode = 'percentage'">百分比</button>
            <button class="mode-btn" :class="{ active: currentProfile.proportionMode === 'relative' }" @click="currentProfile.proportionMode = 'relative'">相对销量</button>
          </div>
          <div class="proportion-list">
            <div v-for="dish in validDishes" :key="dish.id" class="proportion-row">
              <button class="proportion-name link" @click="fillDishForm(dishesMap.get(dish.id))">{{ dish.name || '(未命名)' }}</button>
              <input :value="currentProfile.dishProportions[dish.id]" type="number" min="0" class="input input-proportion" @input="updateProportion(dish.id, $event.target.value)">
              <span class="proportion-unit">{{ currentProfile.proportionMode === 'percentage' ? '%' : '份' }}</span>
            </div>
            <div v-for="combo in validCombos" v-show="currentProfile.includeCombosInOverall" :key="combo.id" class="proportion-row">
              <button class="proportion-name link" @click="fillComboForm(combosMap.get(combo.id))">{{ combo.name || '(未命名)' }} <span class="combo-tag">套餐</span></button>
              <input :value="currentProfile.comboProportions[combo.id]" type="number" min="0" class="input input-proportion" @input="updateComboProportion(combo.id, $event.target.value)">
              <span class="proportion-unit">{{ currentProfile.proportionMode === 'percentage' ? '%' : '份' }}</span>
            </div>
          </div>
          <div v-if="currentProfile.proportionMode === 'percentage'" class="proportion-summary">
            当前占比合计：{{ fmtPercent(proportionSum / 100) }}
            <button v-if="Math.abs(proportionSum - 100) > 0.01" class="btn btn-sm btn-link" @click="normalizePercentages">一键归一</button>
          </div>
          <div class="include-combos-row">
            <label class="checkbox-label">
              <input v-model="currentProfile.includeCombosInOverall" type="checkbox">
              套餐参与整体菜单毛利率计算
            </label>
          </div>
        </div>

        <!-- 各单品贡献 -->
        <div class="result-card">
          <div class="section-title tight">各单品贡献</div>
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
                <td>
                  <button v-if="item.type === 'dish'" class="table-name link" @click="fillDishForm(dishesMap.get(item.id))">{{ item.name || '(未命名)' }}</button>
                  <button v-else class="table-name link" @click="fillComboForm(combosMap.get(item.id))">{{ item.name || '(未命名)' }}</button>
                </td>
                <td><span class="type-tag" :class="item.type">{{ item.type === 'dish' ? '单品' : '套餐' }}</span></td>
                <td>{{ fmtPercent(item.grossMarginRate) }}</td>
                <td>{{ fmtPercent(item.salesProportion) }}</td>
                <td>{{ fmtPercent(item.weightedContribution) }}</td>
              </tr>
              <tr v-if="!overallResult.items.length">
                <td colspan="5" class="empty-cell">暂无数据，请先在左侧录入单品并加入菜单</td>
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

/* 左右布局 4:5 */
.tool-layout {
  display: grid;
  grid-template-columns: 4fr 5fr;
  gap: 20px;
  align-items: start;
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

.section-title:first-child,
.section-title.tight {
  margin-top: 0;
}

.section-title.tight {
  margin-bottom: 10px;
}

/* 方案管理 */
.profile-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.profile-select {
  flex: 1;
  min-width: 110px;
}

.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

/* 表单卡片 */
.form-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  background: var(--bg-secondary);
}

.form-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
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

.form-ingredients {
  border-top: 1px dashed var(--border);
  padding-top: 10px;
  margin-bottom: 10px;
}

.form-subheader {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.ingredient-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.ingredient-row .input:first-child,
.ingredient-row .select {
  flex: 1;
}

.ingredient-row .input:nth-child(2),
.ingredient-row .input-quantity {
  width: 76px;
}

.form-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.dish-live-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  margin-left: auto;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--bg-secondary);
  border: 1px dashed var(--border);
  font-size: 12px;
  color: var(--text-muted);
}

.dish-live-preview.has-data {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-primary));
  color: var(--text-secondary);
}

.dlp-placeholder {
  font-size: 12px;
}

.dlp-item {
  white-space: nowrap;
}

.dlp-item b {
  color: var(--text-primary);
  font-weight: 600;
}

.dlp-rate {
  white-space: nowrap;
  font-weight: 600;
  color: var(--success);
}

.dlp-rate.negative,
.dlp-item b.negative {
  color: var(--error);
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
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
}

.btn-icon:hover {
  background: #fee2e2;
  color: #ef4444;
}

.empty-tip {
  padding: 14px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

/* 菜单概览 */
.overview-group {
  margin-bottom: 10px;
}

.overview-group:last-child {
  margin-bottom: 0;
}

.overview-group-title {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.overview-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  font-size: 13px;
}

.overview-item {
  border-radius: 6px;
}

.overview-item:hover {
  background: var(--bg-secondary);
}

.overview-item:hover .overview-row {
  background: transparent;
}

.overview-row:hover {
  background: var(--bg-secondary);
}

/* 套餐详情：名称下方的单品组成小字 */
.combo-detail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  padding: 0 8px 7px;
  font-size: 11px;
  color: var(--text-muted);
}

.combo-detail-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  padding: 1px 7px;
  border-radius: 10px;
  background: var(--bg-tertiary);
  white-space: nowrap;
}

.cd-dish {
  color: var(--text-secondary);
}

.cd-qty {
  color: var(--accent);
  font-weight: 600;
}

.cd-price {
  color: var(--text-muted);
}

.combo-detail-empty {
  font-style: italic;
}

.overview-name {
  flex: 1;
  min-width: 0;
  text-align: left;
  border: none;
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overview-name:hover {
  text-decoration: underline;
}

/* 售价/成本/毛利率 三列统一宽度并右对齐，保证跨行数字对齐 */
.overview-stat {
  flex-shrink: 0;
  width: 96px;
  text-align: right;
  color: var(--text-secondary);
  white-space: nowrap;
}

.overview-stat.strong {
  color: var(--text-primary);
  font-weight: 600;
  width: 104px;
}

.overview-stat.strong.warn {
  color: #ef4444;
}

/* 整体结果卡片 */
.result-card {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 14px;
}

.result-card:last-of-type {
  margin-bottom: 0;
}

.result-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
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
  font-size: 34px;
  font-weight: 700;
  color: var(--accent);
  text-align: center;
  margin: 12px 0;
}

.result-sub-numbers {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sub-number {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
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

/* 销量占比 */
.mode-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.mode-btn {
  flex: 1;
  padding: 7px;
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
  gap: 6px;
  margin-bottom: 10px;
}

.proportion-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.proportion-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--text-primary);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.proportion-name.link,
.table-name.link {
  border: none;
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}

.proportion-name.link:hover,
.table-name.link:hover {
  text-decoration: underline;
}

.proportion-name .combo-tag {
  font-size: 11px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: 4px;
}

.input-proportion {
  width: 76px;
  text-align: right;
}

.proportion-unit {
  width: 18px;
  font-size: 13px;
  color: var(--text-secondary);
}

.proportion-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-secondary);
}

.include-combos-row {
  margin-top: 10px;
  padding-top: 10px;
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

/* 贡献表 */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 7px 6px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  color: var(--text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

.data-table td:not(:first-child) {
  white-space: nowrap;
}

.type-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  white-space: nowrap;
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
  padding: 14px;
}

.btn-block {
  width: 100%;
  margin-top: 4px;
}
</style>
