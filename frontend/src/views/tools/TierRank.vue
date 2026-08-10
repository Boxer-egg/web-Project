<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useToast } from '../../composables/useToast'
import AiHelpPanel from '../../components/AiHelpPanel.vue'
import * as rankLogic from '../../logic/tier-rank'

const toast = useToast()

const defaultState = () => ({
  title: '我的从夯到拉排行榜',
  subtitle: '主观锐评，仅供快乐讨论',
  style: 'default',
  colorScheme: 'classic',
  tiers: [
    { id: 't1', label: '夯', color: '#ef4444' },
    { id: 't2', label: '顶级', color: '#f97316' },
    { id: 't3', label: '人上人', color: '#eab308' },
    { id: 't4', label: 'NPC', color: '#9ca3af' },
    { id: 't5', label: '拉', color: '#6b7280' },
    { id: 't6', label: '拉完了', color: '#1f2937' },
  ],
  items: [],
})

const state = useStorage('hang-la-state', defaultState())
const selectedTierId = ref(null)
const cardSize = useStorage('hang-la-card-size', 92)
const labelSize = useStorage('hang-la-label-size', 34)
const newTextItems = ref('')
const draggedItemId = ref(null)
const isExporting = ref(false)

watch(() => state.value.colorScheme, (scheme) => {
  rankLogic.applyColorScheme(state.value, scheme)
}, { immediate: true })

watch(() => state.value.style, () => {
  // style affects rendering only
})

const currentStyle = computed(() => rankLogic.STYLE_PRESETS[state.value.style] || rankLogic.STYLE_PRESETS.default)

const rankedItems = computed(() => {
  const map = {}
  for (const tier of state.value.tiers) map[tier.id] = []
  for (const item of state.value.items) {
    if (item.tierId && map[item.tierId]) map[item.tierId].push(item)
  }
  return map
})

const unrankedItems = computed(() => state.value.items.filter(i => !i.tierId))

function applyTierPreset(key) {
  rankLogic.applyTierPreset(state.value, key)
  rankLogic.applyColorScheme(state.value, state.value.colorScheme)
  toast.success(`已应用「${rankLogic.TIER_PRESETS[key].name}」档位`)
}

function applyColorSchemePreset(key) {
  state.value.colorScheme = key
}

function applyStylePreset(key) {
  state.value.style = key
}

function addTextItems() {
  const text = newTextItems.value.trim()
  if (!text) return
  const items = rankLogic.textsToItems(text)
  if (items.length) {
    distributeItems(items)
    newTextItems.value = ''
    toast.success(`已添加 ${items.length} 个卡片`)
  }
}

function distributeItems(items) {
  if (selectedTierId.value) {
    for (const item of items) item.tierId = selectedTierId.value
    state.value.items.push(...items)
    return
  }
  const tiers = state.value.tiers
  if (!tiers.length) return
  // 自动均分到未排序池，保持导入顺序
  state.value.items.push(...items)
}

function autoDistribute() {
  const unranked = state.value.items.filter(i => !i.tierId)
  if (!unranked.length) {
    toast.warn('没有未排序的卡片')
    return
  }
  const tiers = state.value.tiers
  if (!tiers.length) return
  const perTier = Math.ceil(unranked.length / tiers.length)
  for (let i = 0; i < unranked.length; i++) {
    unranked[i].tierId = tiers[Math.floor(i / perTier)]?.id || tiers[0].id
  }
  toast.success('已自动均分到各档位')
}

async function addImages(files) {
  const images = files.filter(f => f.type.startsWith('image/'))
  if (!images.length) return
  let added = 0
  for (const file of images) {
    try {
      const dataUrl = await rankLogic.readFileAsDataURL(file)
      const item = { id: rankLogic.uid(), content: dataUrl, type: 'image', tierId: null }
      distributeItems([item])
      added++
    } catch (e) {
      toast.error('读取图片失败：' + e.message)
    }
  }
  if (added) toast.success(`已添加 ${added} 张图片`)
}

function handleImageUpload(e) {
  addImages(Array.from(e.target.files || []))
  e.target.value = ''
}

function handleDropOnUnranked(e) {
  e.preventDefault()
  const files = rankLogic.getFilesFromEvent(e)
  if (files.length) {
    addImages(files)
    return
  }
  if (draggedItemId.value) {
    moveItemToTier(draggedItemId.value, null)
    draggedItemId.value = null
  }
}

function handleDropOnTier(e, tierId) {
  e.preventDefault()
  const files = rankLogic.getFilesFromEvent(e)
  if (files.length) {
    selectedTierId.value = tierId
    addImages(files)
    return
  }
  if (draggedItemId.value) {
    moveItemToTier(draggedItemId.value, tierId)
    draggedItemId.value = null
  }
}

function handlePaste(e) {
  const active = document.activeElement
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return
  const files = rankLogic.getFilesFromEvent(e)
  if (files.length) {
    addImages(files)
    e.preventDefault()
    return
  }
  const text = rankLogic.getTextFromEvent(e)
  if (text) {
    const items = rankLogic.textsToItems(text)
    distributeItems(items)
    e.preventDefault()
    toast.success(`已粘贴 ${items.length} 个文字卡片`)
  }
}

function onDragStart(itemId) {
  draggedItemId.value = itemId
}

function onDragOver(e) {
  e.preventDefault()
}

function moveItemToTier(itemId, tierId) {
  const item = state.value.items.find(i => i.id === itemId)
  if (item) item.tierId = tierId
}

function removeItem(id) {
  state.value.items = state.value.items.filter(i => i.id !== id)
}

function selectTier(tierId) {
  selectedTierId.value = selectedTierId.value === tierId ? null : tierId
}

function addTier() {
  const id = rankLogic.uid('tier')
  const scheme = rankLogic.COLOR_SCHEMES[state.value.colorScheme]
  const color = scheme?.colors[state.value.tiers.length % scheme.colors.length] || '#6b7280'
  state.value.tiers.push({ id, label: '新', color })
}

function removeTier(tierId) {
  if (state.value.tiers.length <= 1) {
    toast.warn('至少保留一个档位')
    return
  }
  for (const item of state.value.items) {
    if (item.tierId === tierId) item.tierId = null
  }
  state.value.tiers = state.value.tiers.filter(t => t.id !== tierId)
  if (selectedTierId.value === tierId) selectedTierId.value = null
}

function moveTier(index, direction) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= state.value.tiers.length) return
  const tiers = state.value.tiers.slice()
  const [moved] = tiers.splice(index, 1)
  tiers.splice(newIndex, 0, moved)
  state.value.tiers = tiers
}

function loadSample() {
  const items = rankLogic.SAMPLE_TEXTS.map(content => ({ id: rankLogic.uid(), content, type: 'text', tierId: null }))
  state.value.items = items
  toast.success('已加载示例文字卡片')
}

function clearItems() {
  state.value.items = []
  selectedTierId.value = null
}

function exportJson() {
  rankLogic.exportRankJson(state.value)
  toast.success('已导出 JSON')
}

async function handleImportJson(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const data = await rankLogic.importRankJson(file)
    state.value = data
    toast.success('导入成功')
  } catch (err) {
    toast.error('导入失败：' + err.message)
  }
  e.target.value = ''
}

function shareUrl() {
  const encoded = rankLogic.encodeRankState(state.value)
  const url = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(encoded)}`
  navigator.clipboard.writeText(url).then(() => toast.success('分享链接已复制')).catch(() => toast.error('复制失败'))
}

function loadShare() {
  const params = new URLSearchParams(window.location.search)
  const data = params.get('data')
  if (!data) return
  try {
    const parsed = rankLogic.decodeRankState(data)
    state.value = parsed
    toast.success('已从链接恢复排行榜')
  } catch {
    toast.error('分享链接无效')
  }
}

async function exportPng() {
  isExporting.value = true
  try {
    const canvas = await rankLogic.renderRankCanvas(state.value, {
      cardSize: cardSize.value,
      labelSize: labelSize.value,
    })
    rankLogic.downloadCanvas(canvas, `hang-la-${Date.now()}.png`)
    toast.success('高清 PNG 已导出')
  } catch (e) {
    toast.error('导出失败：' + e.message)
  } finally {
    isExporting.value = false
  }
}

async function copyImage() {
  isExporting.value = true
  try {
    const canvas = await rankLogic.renderRankCanvas(state.value, {
      cardSize: cardSize.value,
      labelSize: labelSize.value,
    })
    await rankLogic.copyCanvas(canvas)
    toast.success('图片已复制到剪贴板')
  } catch (e) {
    toast.error('复制失败：' + e.message)
  } finally {
    isExporting.value = false
  }
}

onMounted(() => {
  loadShare()
  window.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  window.removeEventListener('paste', handlePaste)
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🏆 从夯到拉排行榜</h1>
      <AiHelpPanel
        title="从夯到拉排行榜"
        desc="拖拽图片/文字卡片到不同档位，生成可分享的夯拉梗图。支持 Ctrl+V 粘贴图片或文字、高清 PNG 导出。"
        api-tool="tier_rank"
        :params="[
          { name: 'data', desc: 'base64 编码的排行榜数据', required: false, example: 'eyJ0a...' },
        ]"
      />
    </div>

    <div class="two-col">
      <div class="left-panel">
        <div class="card config-card">
          <h3>① 基本内容</h3>
          <label class="field-label">榜单标题</label>
          <input v-model="state.title" class="input" placeholder="榜单标题">
          <label class="field-label">副标题 / 说明</label>
          <input v-model="state.subtitle" class="input" placeholder="副标题">

          <label class="field-label">界面风格</label>
          <div class="chip-row">
            <button
              v-for="(s, key) in rankLogic.STYLE_PRESETS"
              :key="key"
              class="chip"
              :class="{ active: state.style === key }"
              @click="applyStylePreset(key)"
            >{{ s.name }}</button>
          </div>

          <label class="field-label">配色方案</label>
          <div class="chip-row">
            <button
              v-for="(s, key) in rankLogic.COLOR_SCHEMES"
              :key="key"
              class="chip"
              :class="{ active: state.colorScheme === key }"
              @click="applyColorSchemePreset(key)"
            >{{ s.name }}</button>
          </div>

          <label class="field-label">档位预设</label>
          <div class="chip-row">
            <button
              v-for="(p, key) in rankLogic.TIER_PRESETS"
              :key="key"
              class="chip"
              @click="applyTierPreset(key)"
            >{{ p.name }}</button>
          </div>
        </div>

        <div class="card config-card">
          <h3>② 导入素材</h3>
          <div
            class="drop-area"
            @dragover="onDragOver"
            @drop="handleDropOnUnranked"
            @click="$refs.imageInput?.click()"
          >
            <p>把图片拖到这里</p>
            <p class="sub">或点击选择图片，也可以直接 Ctrl + V 粘贴截图 / 图片 / 文字</p>
            <input ref="imageInput" type="file" accept="image/*" multiple style="display:none" @change="handleImageUpload">
          </div>
          <label class="field-label">直接输入文字（一行一个卡片）</label>
          <textarea v-model="newTextItems" class="textarea" rows="4" placeholder="每行一个卡片，例如：&#10;🍔 汉堡&#10;🍕 披萨"></textarea>
          <div class="btn-row">
            <button class="btn" @click="addTextItems">添加文字</button>
            <button class="btn btn-secondary" @click="loadSample">来点示例</button>
            <button class="btn btn-secondary" @click="autoDistribute">一键重排</button>
          </div>
          <p class="tip" :class="{ active: selectedTierId }">
            {{ selectedTierId ? '已选中左侧档位，新导入素材将直接进入该档位' : '未选中行：导入后自动分配到未排序池' }}
          </p>
        </div>

        <div class="card config-card">
          <h3>③ 自定义左侧夯拉字</h3>
          <div class="tier-editor">
            <div v-for="(tier, index) in state.tiers" :key="tier.id" class="tier-edit-row">
              <input v-model="tier.label" class="input tier-label-input">
              <input v-model="tier.color" type="color" class="tier-color-input">
              <button class="btn btn-sm btn-secondary" @click="moveTier(index, -1)" :disabled="index === 0">↑</button>
              <button class="btn btn-sm btn-secondary" @click="moveTier(index, 1)" :disabled="index === state.tiers.length - 1">↓</button>
              <button class="btn btn-sm btn-danger" @click="removeTier(tier.id)">×</button>
            </div>
          </div>
          <div class="btn-row">
            <button class="btn btn-secondary" @click="addTier">加一档</button>
          </div>
        </div>

        <div class="card config-card">
          <h3>④ 视觉细节</h3>
          <div class="slider-row">
            <label>卡片大小：{{ cardSize }}px</label>
            <input v-model.number="cardSize" type="range" min="48" max="160" step="4">
          </div>
          <div class="slider-row">
            <label>左侧文字大小：{{ labelSize }}px</label>
            <input v-model.number="labelSize" type="range" min="16" max="64" step="2">
          </div>
          <div class="btn-row">
            <button class="btn" :disabled="isExporting" @click="exportPng">导出高清 PNG</button>
            <button class="btn btn-secondary" :disabled="isExporting" @click="copyImage">复制图片</button>
            <button class="btn btn-secondary" @click="exportJson">导出 JSON</button>
            <label class="btn btn-secondary" style="cursor:pointer">
              导入 JSON
              <input type="file" accept="application/json" style="display:none" @change="handleImportJson">
            </label>
            <button class="btn btn-secondary" @click="shareUrl">发布 / 分享</button>
            <button class="btn btn-danger" @click="clearItems">清空卡片</button>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="preview-card" :style="{ background: currentStyle.bg, color: currentStyle.text }">
          <div class="preview-header">
            <div>
            <h2 class="preview-title" :style="{ color: currentStyle.text }">{{ state.title }}</h2>
            <p class="preview-subtitle" :style="{ color: currentStyle.text + '99' }">{{ state.subtitle }}</p>
            </div>
            <span class="hang-la-badge" :style="{ color: currentStyle.text }">HANG → LA</span>
          </div>

          <div class="tier-list">
            <div
              v-for="(tier, index) in state.tiers"
              :key="tier.id"
              class="tier-row"
              :class="{ selected: selectedTierId === tier.id }"
            >
              <div
                class="tier-label"
                :style="{ background: tier.color, fontSize: labelSize + 'px' }"
                @click="selectTier(tier.id)"
              >
                <input v-model="tier.label" class="tier-label-input" @click.stop>
              </div>
              <div
              class="tier-zone"
              :style="{ background: currentStyle.cardBg, borderColor: currentStyle.cardBorder }"
              @dragover="onDragOver"
              @drop="handleDropOnTier($event, tier.id)"
              >
                <div
                  v-for="item in rankedItems[tier.id]"
                  :key="item.id"
                  class="rank-card"
                  :style="{ width: cardSize + 'px', height: cardSize + 'px', background: currentStyle.cardBg, borderColor: currentStyle.cardBorder, color: currentStyle.text }"
                  draggable="true"
                  @dragstart="onDragStart(item.id)"
                >
                  <img v-if="item.type === 'image'" :src="item.content" class="card-image">
                  <span v-else class="card-text">{{ item.content }}</span>
                  <button class="card-remove" @click="removeItem(item.id)">×</button>
                </div>
                <div v-if="!rankedItems[tier.id].length" class="zone-empty">拖拽卡片到此处</div>
              </div>
            </div>
          </div>

          <div class="unranked-zone">
            <h4>待排序（{{ unrankedItems.length }}）</h4>
            <div
              class="tier-zone unranked"
              :style="{ background: currentStyle.cardBg, borderColor: currentStyle.cardBorder }"
              @dragover="onDragOver"
              @drop="handleDropOnUnranked"
            >
              <div
                v-for="item in unrankedItems"
                :key="item.id"
                class="rank-card"
                :style="{ width: cardSize + 'px', height: cardSize + 'px', background: currentStyle.cardBg, borderColor: currentStyle.cardBorder, color: currentStyle.text }"
                draggable="true"
                @dragstart="onDragStart(item.id)"
              >
                <img v-if="item.type === 'image'" :src="item.content" class="card-image">
                <span v-else class="card-text">{{ item.content }}</span>
                <button class="card-remove" @click="removeItem(item.id)">×</button>
              </div>
              <div v-if="!unrankedItems.length" class="zone-empty">暂无卡片</div>
            </div>
          </div>

          <div class="preview-footer" :style="{ color: currentStyle.text + '80' }">
            vvzzv.com · 从夯到拉排行榜
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.two-col {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
}
@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.config-card {
  padding: 16px;
}
.config-card h3 {
  font-size: 15px;
  margin-bottom: 12px;
  color: var(--text-primary);
}
.field-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin: 12px 0 6px;
}
.field-label:first-of-type {
  margin-top: 0;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}
.chip.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.drop-area {
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  padding: 16px;
  text-align: center;
  cursor: pointer;
  background: var(--bg-secondary);
  transition: background 0.2s, border-color 0.2s;
  margin-bottom: 12px;
}
.drop-area:hover {
  border-color: var(--accent);
  background: var(--bg-primary);
}
.drop-area p {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
}
.drop-area .sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}
.textarea {
  margin-bottom: 8px;
}
.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}
.tip.active {
  color: var(--accent);
}
.tier-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}
.tier-edit-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.tier-label-input {
  flex: 1;
  min-width: 80px;
  padding: 6px 8px;
  font-size: 14px;
}
.tier-color-input {
  width: 32px;
  height: 32px;
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.slider-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}
.slider-row input[type="range"] {
  width: 100%;
}
.right-panel {
  min-width: 0;
}
.preview-card {
  border-radius: var(--radius);
  padding: 20px;
  border: 1px solid var(--border);
  min-height: 400px;
}
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}
.preview-title {
  font-size: 22px;
  margin: 0 0 4px;
  font-weight: 700;
}
.preview-subtitle {
  font-size: 13px;
  margin: 0;
}
.hang-la-badge {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid currentColor;
  padding: 4px 8px;
  border-radius: 6px;
  opacity: 0.7;
}
.tier-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tier-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
  border-radius: var(--radius);
  padding: 6px;
  transition: background 0.2s;
}
.tier-row.selected {
  background: rgba(59, 130, 246, 0.15);
  outline: 1px dashed var(--accent);
}
.tier-label {
  width: 110px;
  min-width: 110px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  padding: 8px;
  text-align: center;
}
.tier-label input {
  width: 100%;
  background: rgba(255,255,255,0.25);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 6px;
  color: #fff;
  text-align: center;
  font-size: inherit;
  font-weight: inherit;
  padding: 4px 0;
}
.tier-label input:focus {
  outline: none;
  background: rgba(255,255,255,0.4);
}
.tier-zone {
  flex: 1;
  border: 1px dashed transparent;
  border-radius: var(--radius);
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
  min-height: 80px;
}
.tier-zone.unranked {
  border-style: dashed;
}
.zone-empty {
  width: 100%;
  text-align: center;
  font-size: 13px;
  opacity: 0.5;
  padding: 20px 0;
  pointer-events: none;
}
.rank-card {
  position: relative;
  border-radius: var(--radius);
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: grab;
  user-select: none;
}
.rank-card:active {
  cursor: grabbing;
}
.card-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.card-text {
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 4px;
  word-break: break-word;
  line-height: 1.2;
}
.card-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: var(--error);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
}
.rank-card:hover .card-remove {
  display: flex;
}
.unranked-zone {
  margin-top: 16px;
}
.unranked-zone h4 {
  font-size: 13px;
  margin-bottom: 8px;
  opacity: 0.7;
}
.preview-footer {
  text-align: right;
  font-size: 12px;
  margin-top: 16px;
}
@media (max-width: 640px) {
  .tier-row {
    flex-direction: column;
  }
  .tier-label {
    width: 100%;
    min-height: 48px;
  }
}
</style>
