<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useStorage, useDebounceFn } from '@vueuse/core'
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  SIZE_PRESETS,
  FONT_OPTIONS,
  GRID_SPACING_OPTIONS,
  MARGIN_OPTIONS,
  sanitizeDimensions,
  computeScale,
  cmToPx,
  pxToCm,
  cmToPxAtDpi,
  getElementBounds,
  snapElement,
  measureEdgeDistances,
  measureSpacing,
  createTextElement,
  createLogoElement,
  fontFamilyFor,
  formatCm,
  uid,
} from '../../logic/storefrontSign.js'
import { processLogo, imageToDataURL } from '../../utils/imageProcessing.js'

// ============================================================
// Sign / canvas state
// ============================================================
const signWidth = useStorage('storefront-sign-width', DEFAULT_WIDTH)
const signHeight = useStorage('storefront-sign-height', DEFAULT_HEIGHT)
const selectedPreset = useStorage('storefront-sign-preset', 'standard')

const showGrid = useStorage('storefront-sign-grid', false)
const gridSpacing = useStorage('storefront-sign-grid-spacing', 10)
const showMargin = useStorage('storefront-sign-margin', false)
const marginSize = useStorage('storefront-sign-margin-size', 10)
const enableSnap = useStorage('storefront-sign-snap', true)
const showGuides = useStorage('storefront-sign-guides', true)
const exportDpi = useStorage('storefront-sign-export-dpi', false)

const canvasScale = ref(1)
const canvasWrapperRef = ref(null)
const canvasRef = ref(null)
const fileInputRef = ref(null)

// ============================================================
// Elements
// ============================================================
const elements = useStorage('storefront-sign-elements', [])
const selectedId = ref(null)
const isLoading = ref(false)
const errorMsg = ref('')

function ensureDefaults() {
  if (!elements.value || elements.value.length === 0) {
    elements.value = [createTextElement('heading', signWidth.value, signHeight.value)]
  }
}
ensureDefaults()

// ============================================================
// Drag / resize / rotate state
// ============================================================
const dragState = ref(null)

// ============================================================
// Computed
// ============================================================
const selectedEl = computed(() => elements.value.find((e) => e.id === selectedId.value) || null)

const sortedElements = computed(() => {
  // Draw order: text on top of logos generally feels better, but keep creation order for same type.
  return [...elements.value].sort((a, b) => {
    if (a.type === b.type) return 0
    return a.type === 'logo' ? -1 : 1
  })
})

const dimensions = computed(() => sanitizeDimensions(signWidth.value, signHeight.value))

// ============================================================
// Preset handling
// ============================================================
function applyPreset(key) {
  const preset = SIZE_PRESETS.find((p) => p.key === key)
  if (!preset) return
  selectedPreset.value = key
  if (preset.width && preset.height) {
    signWidth.value = preset.width
    signHeight.value = preset.height
  }
}

watch([signWidth, signHeight], () => {
  const preset = SIZE_PRESETS.find(
    (p) => p.width === Number(signWidth.value) && p.height === Number(signHeight.value)
  )
  selectedPreset.value = preset ? preset.key : 'custom'
})

// ============================================================
// Canvas sizing
// ============================================================
function updateCanvasScale() {
  if (!canvasWrapperRef.value) return
  const rect = canvasWrapperRef.value.getBoundingClientRect()
  const scale = computeScale(dimensions.value.width, dimensions.value.height, rect.width, rect.height, 32)
  canvasScale.value = scale
}

onMounted(() => {
  updateCanvasScale()
  window.addEventListener('resize', updateCanvasScale)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasScale)
})

// ============================================================
// Element operations
// ============================================================
function addText(type) {
  const el = createTextElement(type, signWidth.value, signHeight.value)
  elements.value.push(el)
  selectedId.value = el.id
  nextTick(renderCanvas)
}

function deleteElement(id) {
  elements.value = elements.value.filter((e) => e.id !== id)
  if (selectedId.value === id) selectedId.value = null
  nextTick(renderCanvas)
}

function duplicateElement(el) {
  const copy = JSON.parse(JSON.stringify(el))
  copy.id = uid(el.type)
  copy.x += 10
  copy.y += 10
  elements.value.push(copy)
  selectedId.value = copy.id
  nextTick(renderCanvas)
}

// ============================================================
// Logo upload
// ============================================================
function triggerLogoUpload() {
  fileInputRef.value?.click()
}

async function onLogoFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    errorMsg.value = '请上传 PNG / JPG / SVG 格式图片'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    errorMsg.value = '图片过大，请选择 10MB 以内的图片'
    return
  }

  isLoading.value = true
  errorMsg.value = ''
  try {
    const dataUrl = await processLogo(file, {
      removeBackground: false,
      removeThreshold: 30,
      replaceColor: false,
      replacementColor: '#000000',
    })
    const img = new Image()
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight
      const el = createLogoElement(signWidth.value, signHeight.value)
      el.src = dataUrl
      el.originalSrc = dataUrl
      el.width = ratio >= 1 ? 60 : 40
      el.height = el.width / ratio
      el.x = signWidth.value / 2 - el.width / 2
      el.y = signHeight.value / 2 - el.height / 2
      elements.value.push(el)
      selectedId.value = el.id
      isLoading.value = false
      nextTick(renderCanvas)
    }
    img.onerror = () => {
      errorMsg.value = 'Logo 加载失败'
      isLoading.value = false
    }
    img.src = dataUrl
  } catch (err) {
    errorMsg.value = err.message || 'Logo 处理失败'
    isLoading.value = false
  }
}

// ============================================================
// Logo processing
// ============================================================
async function refreshLogo(el) {
  if (el.type !== 'logo' || !el.originalSrc) return
  isLoading.value = true
  try {
    const dataUrl = await processLogo(el.originalSrc, {
      removeBackground: el.removeBackground,
      removeThreshold: el.removeThreshold,
      replaceColor: el.replaceColor,
      replacementColor: el.replacementColor,
    })
    el.src = dataUrl
    nextTick(renderCanvas)
  } catch (err) {
    errorMsg.value = err.message || 'Logo 处理失败'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => elements.value.map((e) => (e.type === 'logo' ? [e.removeBackground, e.removeThreshold, e.replaceColor, e.replacementColor] : [])).flat(),
  async () => {
    const el = selectedEl.value
    if (el && el.type === 'logo') {
      await refreshLogo(el)
    }
  },
  { deep: true }
)

// ============================================================
// Canvas rendering
// ============================================================
function renderCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const scale = canvasScale.value
  const w = dimensions.value.width
  const h = dimensions.value.height

  canvas.width = Math.max(1, Math.floor(cmToPx(w, scale)))
  canvas.height = Math.max(1, Math.floor(cmToPx(h, scale)))

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Grid
  if (showGrid.value) {
    drawGrid(ctx, w, h, scale)
  }

  // Margin
  if (showMargin.value) {
    drawMargin(ctx, w, h, scale)
  }

  // Elements
  for (const el of sortedElements.value) {
    if (el.type === 'text') {
      drawTextElement(ctx, el, scale)
    } else if (el.type === 'logo') {
      drawLogoElement(ctx, el, scale)
    }
  }

  // Selection / guides
  if (selectedEl.value && showGuides.value) {
    drawSelection(ctx, selectedEl.value, scale)
    drawDistanceAnnotations(ctx, selectedEl.value, scale)
  }
}

const debouncedRender = useDebounceFn(renderCanvas, 100)

function drawGrid(ctx, w, h, scale) {
  const spacing = Number(gridSpacing.value) || 10
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= w; x += spacing) {
    const px = cmToPx(x, scale)
    ctx.moveTo(px, 0)
    ctx.lineTo(px, cmToPx(h, scale))
  }
  for (let y = 0; y <= h; y += spacing) {
    const py = cmToPx(y, scale)
    ctx.moveTo(0, py)
    ctx.lineTo(cmToPx(w, scale), py)
  }
  ctx.stroke()
}

function drawMargin(ctx, w, h, scale) {
  const margin = Number(marginSize.value) || 10
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.strokeRect(cmToPx(margin, scale), cmToPx(margin, scale), cmToPx(w - margin * 2, scale), cmToPx(h - margin * 2, scale))
  ctx.setLineDash([])
}

function drawTextElement(ctx, el, scale) {
  const x = cmToPx(el.x, scale)
  const y = cmToPx(el.y, scale)
  const fontSize = cmToPx(el.fontSize, scale)
  const family = fontFamilyFor(el.fontFamily)
  const weight = el.bold ? 'bold' : 'normal'

  ctx.save()
  ctx.translate(x + cmToPx(el.width, scale) / 2, y + cmToPx(el.height, scale) / 2)
  ctx.rotate(((el.rotation || 0) * Math.PI) / 180)

  ctx.font = `${weight} ${fontSize}px ${family}`
  ctx.fillStyle = el.color || '#000000'
  ctx.textBaseline = 'middle'

  if (el.vertical) {
    const chars = String(el.text || '').split('')
    const lineHeight = fontSize * 1.1
    const totalH = chars.length * lineHeight
    ctx.textAlign = 'center'
    chars.forEach((char, i) => {
      ctx.fillText(char, 0, -totalH / 2 + i * lineHeight + lineHeight / 2)
    })
  } else {
    ctx.textAlign = 'center'
    ctx.fillText(el.text || '', 0, 0)
  }

  ctx.restore()
}

function drawLogoElement(ctx, el, scale) {
  if (!el.src) return
  const img = new Image()
  img.onload = () => {
    ctx.save()
    ctx.translate(cmToPx(el.x + el.width / 2, scale), cmToPx(el.y + el.height / 2, scale))
    ctx.rotate(((el.rotation || 0) * Math.PI) / 180)
    ctx.drawImage(img, -cmToPx(el.width, scale) / 2, -cmToPx(el.height, scale) / 2, cmToPx(el.width, scale), cmToPx(el.height, scale))
    ctx.restore()
  }
  img.src = el.src
}

function drawSelection(ctx, el, scale) {
  const b = getElementBounds(el)
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.strokeRect(cmToPx(b.left, scale), cmToPx(b.top, scale), cmToPx(b.right - b.left, scale), cmToPx(b.bottom - b.top, scale))
  ctx.setLineDash([])

  // Corner resize handles
  const corners = [
    [b.left, b.top],
    [b.right, b.top],
    [b.left, b.bottom],
    [b.right, b.bottom],
  ]
  ctx.fillStyle = '#3b82f6'
  for (const [cx, cy] of corners) {
    ctx.fillRect(cmToPx(cx, scale) - 4, cmToPx(cy, scale) - 4, 8, 8)
  }
}

function drawDistanceAnnotations(ctx, el, scale) {
  const b = getElementBounds(el)
  const w = dimensions.value.width
  const h = dimensions.value.height
  const dist = measureEdgeDistances(el, dimensions.value)

  ctx.fillStyle = '#ef4444'
  ctx.font = '10px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Top
  if (dist.top > 0) {
    ctx.fillText(formatCm(dist.top), cmToPx(b.left + (b.right - b.left) / 2, scale), cmToPx(dist.top / 2, scale))
  }
  // Bottom
  if (dist.bottom > 0) {
    ctx.fillText(formatCm(dist.bottom), cmToPx(b.left + (b.right - b.left) / 2, scale), cmToPx(h - dist.bottom / 2, scale))
  }
  // Left
  if (dist.left > 0) {
    ctx.textAlign = 'right'
    ctx.fillText(formatCm(dist.left), cmToPx(dist.left / 2, scale), cmToPx(b.top + (b.bottom - b.top) / 2, scale))
  }
  // Right
  if (dist.right > 0) {
    ctx.textAlign = 'left'
    ctx.fillText(formatCm(dist.right), cmToPx(w - dist.right / 2, scale), cmToPx(b.top + (b.bottom - b.top) / 2, scale))
  }
}

// ============================================================
// Watchers that trigger render
// ============================================================
watch(
  [dimensions, canvasScale, showGrid, gridSpacing, showMargin, marginSize, showGuides, elements],
  () => {
    nextTick(debouncedRender)
  },
  { deep: true }
)

// ============================================================
// Mouse interactions
// ============================================================
function getCanvasPoint(e) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  return {
    x: pxToCm(e.clientX - rect.left, canvasScale.value),
    y: pxToCm(e.clientY - rect.top, canvasScale.value),
  }
}

function onCanvasMouseDown(e) {
  const pt = getCanvasPoint(e)
  const clicked = hitTest(pt.x, pt.y)
  if (clicked) {
    selectedId.value = clicked.id
    dragState.value = {
      id: clicked.id,
      action: 'move',
      startX: pt.x,
      startY: pt.y,
      initialX: clicked.x,
      initialY: clicked.y,
    }
  } else {
    selectedId.value = null
  }
}

function onCanvasMouseMove(e) {
  if (!dragState.value) return
  e.preventDefault()
  const pt = getCanvasPoint(e)
  const el = elements.value.find((item) => item.id === dragState.value.id)
  if (!el) return

  if (dragState.value.action === 'move') {
    const dx = pt.x - dragState.value.startX
    const dy = pt.y - dragState.value.startY
    let nx = dragState.value.initialX + dx
    let ny = dragState.value.initialY + dy

    const temp = { ...el, x: nx, y: ny }
    const others = elements.value.filter((item) => item.id !== el.id)
    const snap = snapElement(temp, dimensions.value, others, showGrid.value ? Number(gridSpacing.value) : 0, 1, enableSnap.value)

    el.x = snap.x
    el.y = snap.y
    renderCanvas()
  }
}

function onCanvasMouseUp() {
  dragState.value = null
}

function hitTest(x, y) {
  // Hit test in reverse draw order so top-most element is selected.
  for (let i = elements.value.length - 1; i >= 0; i--) {
    const el = elements.value[i]
    const b = getElementBounds(el)
    if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) {
      return el
    }
  }
  return null
}

// ============================================================
// Export
// ============================================================
function exportImage({ annotated = false, realDpi = false }) {
  const canvas = document.createElement('canvas')
  const w = dimensions.value.width
  const h = dimensions.value.height
  const scale = realDpi ? cmToPxAtDpi(1, 300) : canvasScale.value * 2

  canvas.width = Math.max(1, Math.floor(w * scale))
  canvas.height = Math.max(1, Math.floor(h * scale))
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (showGrid.value) drawGrid(ctx, w, h, scale)
  if (showMargin.value) drawMargin(ctx, w, h, scale)

  for (const el of sortedElements.value) {
    if (el.type === 'text') drawTextElement(ctx, el, scale)
    else if (el.type === 'logo') drawLogoElement(ctx, el, scale)
  }

  if (annotated) {
    drawAnnotationsForExport(ctx, scale)
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      errorMsg.value = '图片生成失败，请重试'
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const suffix = annotated ? '_工程图' : ''
    a.download = `门头设计_${w}x${h}cm${suffix}_${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

function drawAnnotationsForExport(ctx, scale) {
  const w = dimensions.value.width
  const h = dimensions.value.height

  ctx.strokeStyle = '#9ca3af'
  ctx.fillStyle = '#374151'
  ctx.lineWidth = 1
  ctx.font = `${Math.max(12, Math.floor(scale * 0.5))}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Overall dimensions
  ctx.strokeRect(cmToPx(0, scale), cmToPx(0, scale), cmToPx(w, scale), cmToPx(h, scale))
  ctx.fillText(`${w} × ${h} cm`, cmToPx(w / 2, scale), cmToPx(-0.8, scale))
}

// ============================================================
// Save / load design
// ============================================================
function saveDesign() {
  const data = {
    version: 1,
    width: dimensions.value.width,
    height: dimensions.value.height,
    elements: elements.value,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `门头设计_${dimensions.value.width}x${dimensions.value.height}cm_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function loadDesign(file) {
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result)
      if (data.width) signWidth.value = data.width
      if (data.height) signHeight.value = data.height
      if (Array.isArray(data.elements)) {
        elements.value = data.elements
      }
      selectedId.value = null
      nextTick(renderCanvas)
    } catch {
      errorMsg.value = '设计文件解析失败'
    }
  }
  reader.readAsText(file)
}

function onDesignFile(e) {
  const file = e.target.files?.[0]
  if (file) loadDesign(file)
}

function clearDesign() {
  if (!confirm('确定清空当前设计吗？')) return
  elements.value = []
  selectedId.value = null
  ensureDefaults()
  nextTick(renderCanvas)
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <div>
        <h1>🏪 门头编辑器</h1>
        <p class="tool-desc">输入招牌尺寸，拖拽文字与 Logo，快速排版并导出工程图或 PNG 预览。</p>
      </div>
    </div>

    <div class="editor-layout">
      <!-- Canvas area -->
      <div class="canvas-panel card">
        <div class="canvas-toolbar">
          <button class="btn btn-sm btn-secondary" @click="addText('heading')">+ 大字</button>
          <button class="btn btn-sm btn-secondary" @click="addText('sub')">+ 小字</button>
          <button class="btn btn-sm btn-secondary" @click="triggerLogoUpload">+ Logo</button>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            style="display:none"
            @change="onLogoFile"
          />
          <button class="btn btn-sm btn-secondary" @click="saveDesign">保存 JSON</button>
          <label class="btn btn-sm btn-secondary" style="position:relative;cursor:pointer">
            加载 JSON
            <input type="file" accept="application/json" style="display:none" @change="onDesignFile" />
          </label>
          <button class="btn btn-sm btn-danger" @click="clearDesign">清空</button>
        </div>

        <div ref="canvasWrapperRef" class="canvas-wrapper">
          <canvas
            ref="canvasRef"
            class="sign-canvas"
            @mousedown="onCanvasMouseDown"
            @mousemove="onCanvasMouseMove"
            @mouseup="onCanvasMouseUp"
            @mouseleave="onCanvasMouseUp"
          />
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <div v-if="isLoading" class="loading-msg">处理中…</div>
      </div>

      <!-- Properties panel -->
      <div class="properties-panel card">
        <h3>招牌设置</h3>
        <div class="control-group">
          <label class="control-label">预设尺寸</label>
          <select v-model="selectedPreset" class="input" @change="applyPreset(selectedPreset)">
            <option v-for="p in SIZE_PRESETS" :key="p.key" :value="p.key">{{ p.label }}</option>
          </select>
        </div>
        <div class="control-row">
          <div class="control-group">
            <label class="control-label">宽 (cm)</label>
            <input v-model.number="signWidth" type="number" class="input" :min="10" :max="1000" />
          </div>
          <div class="control-group">
            <label class="control-label">高 (cm)</label>
            <input v-model.number="signHeight" type="number" class="input" :min="10" :max="500" />
          </div>
        </div>

        <h3>辅助工具</h3>
        <div class="control-row">
          <label class="inline-label">
            <input v-model="showGrid" type="checkbox" />
            网格
          </label>
          <label class="inline-label">
            <input v-model="showMargin" type="checkbox" />
            安全边界
          </label>
          <label class="inline-label">
            <input v-model="enableSnap" type="checkbox" />
            吸附
          </label>
          <label class="inline-label">
            <input v-model="showGuides" type="checkbox" />
            辅助线
          </label>
        </div>
        <div class="control-row">
          <div class="control-group">
            <label class="control-label">网格间距 (cm)</label>
            <select v-model.number="gridSpacing" class="input">
              <option v-for="g in GRID_SPACING_OPTIONS" :key="g" :value="g">{{ g }} cm</option>
            </select>
          </div>
          <div class="control-group">
            <label class="control-label">安全边界 (cm)</label>
            <select v-model.number="marginSize" class="input">
              <option v-for="m in MARGIN_OPTIONS" :key="m" :value="m">{{ m }} cm</option>
            </select>
          </div>
        </div>

        <template v-if="selectedEl">
          <h3>元素属性</h3>
          <div class="control-group">
            <label class="control-label">类型</label>
            <div class="static-text">{{ selectedEl.type === 'text' ? (selectedEl.name || '文字') : 'Logo' }}</div>
          </div>

          <!-- Text properties -->
          <template v-if="selectedEl.type === 'text'">
            <div class="control-group">
              <label class="control-label">文字内容</label>
              <input v-model="selectedEl.text" type="text" class="input" />
            </div>
            <div class="control-group">
              <label class="control-label">字体</label>
              <select v-model="selectedEl.fontFamily" class="input">
                <option v-for="f in FONT_OPTIONS" :key="f.key" :value="f.key">{{ f.label }}</option>
              </select>
            </div>
            <div class="control-row">
              <div class="control-group">
                <label class="control-label">字号 (cm)</label>
                <input v-model.number="selectedEl.fontSize" type="number" class="input" min="5" max="200" />
              </div>
              <div class="control-group">
                <label class="control-label">颜色</label>
                <input v-model="selectedEl.color" type="color" class="color-picker" />
              </div>
            </div>
            <div class="control-row">
              <label class="inline-label">
                <input v-model="selectedEl.bold" type="checkbox" />
                加粗
              </label>
              <label class="inline-label">
                <input v-model="selectedEl.vertical" type="checkbox" />
                竖排
              </label>
            </div>
            <div class="control-row">
              <div class="control-group">
                <label class="control-label">X (cm)</label>
                <input v-model.number="selectedEl.x" type="number" class="input" step="0.1" />
              </div>
              <div class="control-group">
                <label class="control-label">Y (cm)</label>
                <input v-model.number="selectedEl.y" type="number" class="input" step="0.1" />
              </div>
            </div>
            <div class="control-row">
              <div class="control-group">
                <label class="control-label">宽 (cm)</label>
                <input v-model.number="selectedEl.width" type="number" class="input" min="1" />
              </div>
              <div class="control-group">
                <label class="control-label">高 (cm)</label>
                <input v-model.number="selectedEl.height" type="number" class="input" min="1" />
              </div>
            </div>
            <div class="control-group">
              <label class="control-label">旋转 (°)</label>
              <input v-model.number="selectedEl.rotation" type="range" class="density-slider" min="0" max="360" />
              <input v-model.number="selectedEl.rotation" type="number" class="input number-input" min="0" max="360" />
            </div>
          </template>

          <!-- Logo properties -->
          <template v-if="selectedEl.type === 'logo'">
            <div class="control-row">
              <label class="inline-label">
                <input v-model="selectedEl.removeBackground" type="checkbox" />
                去底色
              </label>
              <label class="inline-label">
                <input v-model="selectedEl.replaceColor" type="checkbox" />
                颜色替换
              </label>
            </div>
            <div v-if="selectedEl.removeBackground" class="control-group">
              <label class="control-label">去底色阈值</label>
              <input v-model.number="selectedEl.removeThreshold" type="range" class="density-slider" min="0" max="255" />
              <input v-model.number="selectedEl.removeThreshold" type="number" class="input number-input" min="0" max="255" />
            </div>
            <div v-if="selectedEl.replaceColor" class="control-row">
              <div class="control-group">
                <label class="control-label">替换为</label>
                <input v-model="selectedEl.replacementColor" type="color" class="color-picker" />
              </div>
            </div>
            <div class="control-row">
              <div class="control-group">
                <label class="control-label">宽 (cm)</label>
                <input v-model.number="selectedEl.width" type="number" class="input" min="1" step="0.1" />
              </div>
              <div class="control-group">
                <label class="control-label">高 (cm)</label>
                <input v-model.number="selectedEl.height" type="number" class="input" min="1" step="0.1" />
              </div>
            </div>
            <div class="control-row">
              <div class="control-group">
                <label class="control-label">X (cm)</label>
                <input v-model.number="selectedEl.x" type="number" class="input" step="0.1" />
              </div>
              <div class="control-group">
                <label class="control-label">Y (cm)</label>
                <input v-model.number="selectedEl.y" type="number" class="input" step="0.1" />
              </div>
            </div>
            <div class="control-group">
              <label class="control-label">旋转 (°)</label>
              <input v-model.number="selectedEl.rotation" type="range" class="density-slider" min="0" max="360" />
              <input v-model.number="selectedEl.rotation" type="number" class="input number-input" min="0" max="360" />
            </div>
          </template>

          <!-- Spacing info -->
          <div class="spacing-info">
            <div class="info-row">
              <span>到左</span>
              <strong>{{ formatCm(measureEdgeDistances(selectedEl, dimensions).left) }}</strong>
            </div>
            <div class="info-row">
              <span>到上</span>
              <strong>{{ formatCm(measureEdgeDistances(selectedEl, dimensions).top) }}</strong>
            </div>
            <div class="info-row">
              <span>到右</span>
              <strong>{{ formatCm(measureEdgeDistances(selectedEl, dimensions).right) }}</strong>
            </div>
            <div class="info-row">
              <span>到下</span>
              <strong>{{ formatCm(measureEdgeDistances(selectedEl, dimensions).bottom) }}</strong>
            </div>
          </div>

          <div class="control-row" style="margin-top: 12px">
            <button class="btn btn-secondary btn-sm" @click="duplicateElement(selectedEl)">复制</button>
            <button class="btn btn-danger btn-sm" @click="deleteElement(selectedEl.id)">删除</button>
          </div>
        </template>

        <template v-else>
          <div class="hint">点击画布中的元素进行编辑，或从上方添加文字/Logo。</div>
        </template>

        <h3>导出</h3>
        <div class="control-group">
          <label class="inline-label">
            <input v-model="exportDpi" type="checkbox" />
            按真实 DPI (300) 导出
          </label>
        </div>
        <div class="control-row">
          <button class="btn btn-primary" @click="exportImage({ annotated: false, realDpi: exportDpi })">导出 PNG</button>
          <button class="btn btn-secondary" @click="exportImage({ annotated: true, realDpi: exportDpi })">导出工程图</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StorefrontSignEditor'
}
</script>

<style scoped>
.tool-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}
.editor-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: start;
}
.canvas-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 500px;
}
.canvas-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.canvas-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  overflow: auto;
  min-height: 400px;
  padding: 20px;
}
.sign-canvas {
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: crosshair;
  max-width: 100%;
  max-height: 100%;
}
.properties-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.properties-panel h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
}
.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.control-label {
  font-size: 13px;
  color: var(--text-secondary);
}
.control-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.control-row .control-group {
  flex: 1;
  min-width: 80px;
}
.inline-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}
.static-text {
  font-size: 14px;
  color: var(--text-primary);
  padding: 6px 0;
}
.color-picker {
  width: 40px;
  height: 32px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  cursor: pointer;
}
.density-slider {
  flex: 1;
}
.number-input {
  width: 70px;
}
.spacing-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  margin-top: 8px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.info-row span {
  color: var(--text-secondary);
}
.info-row strong {
  color: var(--text-primary);
}
.hint {
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
  padding: 20px 0;
}
.error-msg {
  padding: 10px 12px;
  border-radius: var(--radius);
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
  font-size: 13px;
}
.loading-msg {
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}
@media (max-width: 768px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }
  .properties-panel {
    order: 2;
  }
  .canvas-panel {
    order: 1;
  }
}
</style>
