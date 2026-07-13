<script setup>
import { ref, computed, watch, nextTick, shallowRef } from 'vue'
import { useStorage, useDebounceFn } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'
import {
  buildWatermarkText,
  densityToGrid,
  calcSinglePosition,
  fontFamilyOption,
  WATERMARK_SUFFIX_OPTIONS,
  FONT_OPTIONS,
  POSITION_OPTIONS,
} from '../../logic/imageWatermark.js'

// ============================================================
// State
// ============================================================
const originalImage = shallowRef(null)
const originalFileName = ref('')
const originalFileType = ref('')
const isDragging = ref(false)
const errorMsg = ref('')
const isLoading = ref(false)

const middleText = useStorage('watermark-middle', '')
const suffix = useStorage('watermark-suffix', WATERMARK_SUFFIX_OPTIONS[0])
const customSuffix = useStorage('watermark-custom-suffix', '')
const density = useStorage('watermark-density', 0)
const isSingleMode = useStorage('watermark-single-mode', true)
const position = useStorage('watermark-position', 'center')
const fontKey = useStorage('watermark-font', 'system')
const fontSize = useStorage('watermark-font-size', 24)
const color = useStorage('watermark-color', '#808080')
const opacity = useStorage('watermark-opacity', 0.4)
const rotation = useStorage('watermark-rotation', 30)
const isBold = useStorage('watermark-bold', false)

const canvasRef = ref(null)
const fileInputRef = ref(null)

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

// ============================================================
// Computed
// ============================================================
const hasImage = computed(() => !!originalImage.value)

const suffixOptions = computed(() => [
  ...WATERMARK_SUFFIX_OPTIONS,
  'custom',
])

const effectiveSuffix = computed(() => {
  if (suffix.value === 'custom') return customSuffix.value
  return suffix.value
})

const watermarkText = computed(() => {
  const text = buildWatermarkText('仅供', middleText.value, effectiveSuffix.value)
  return text || '仅供示例使用'
})

const isSingle = computed(() => {
  return isSingleMode.value || Number(density.value) === 0
})

const displayFontSize = computed(() => {
  return Math.max(12, Math.min(120, Number(fontSize.value) || 24))
})

const displayOpacity = computed(() => {
  return Math.max(0, Math.min(1, Number(opacity.value) || 0))
})

const displayRotation = computed(() => {
  return Math.max(-90, Math.min(90, Number(rotation.value) || 0))
})

const downloadDisabled = computed(() => !hasImage.value || isLoading.value)

// ============================================================
// Watchers: sync single-mode switch and density slider
// ============================================================
watch(isSingleMode, (single) => {
  if (single) density.value = 0
})

watch(density, (val) => {
  if (Number(val) > 0) isSingleMode.value = false
  else isSingleMode.value = true
})

// ============================================================
// Canvas rendering
// ============================================================
const debouncedRender = useDebounceFn(renderCanvas, 100)

watch(
  [
    originalImage,
    canvasRef,
    middleText,
    suffix,
    customSuffix,
    density,
    position,
    fontKey,
    fontSize,
    color,
    opacity,
    rotation,
    isBold,
  ],
  () => {
    nextTick(debouncedRender)
  },
  { deep: true }
)

function renderCanvas() {
  if (!originalImage.value || !canvasRef.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    errorMsg.value = '当前浏览器不支持 Canvas，请更换浏览器'
    return
  }

  const img = originalImage.value
  const w = img.naturalWidth
  const h = img.naturalHeight

  canvas.width = w
  canvas.height = h

  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  drawWatermarks(ctx, w, h)
}

function drawWatermarks(ctx, w, h) {
  const text = watermarkText.value
  const size = displayFontSize.value
  const family = fontFamilyOption(fontKey.value)
  const weight = isBold.value ? 'bold' : 'normal'
  ctx.font = `${weight} ${size}px ${family}`
  ctx.fillStyle = color.value || '#808080'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  const metrics = ctx.measureText(text)
  const textWidth = metrics.width
  const textHeight = size

  ctx.save()
  ctx.globalAlpha = displayOpacity.value

  if (isSingle.value) {
    const { x, y } = calcSinglePosition(
      position.value,
      w,
      h,
      textWidth,
      textHeight,
      20
    )
    drawRotatedText(ctx, text, x + textWidth / 2, y + textHeight / 2, displayRotation.value)
  } else {
    const grid = densityToGrid(density.value, 2, 10)
    drawTiledWatermarks(ctx, text, w, h, textWidth, textHeight, grid)
  }

  ctx.restore()
}

function drawTiledWatermarks(ctx, text, w, h, textWidth, textHeight, grid) {
  const cols = grid.cols
  const rows = grid.rows
  const stepX = w / cols
  const stepY = h / rows

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * stepX + stepX / 2
      const cy = row * stepY + stepY / 2
      drawRotatedText(ctx, text, cx, cy, displayRotation.value)
    }
  }
}

function drawRotatedText(ctx, text, cx, cy, angleDeg) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angleDeg * (Math.PI / 180))
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

// ============================================================
// File handling
// ============================================================
function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) loadFile(file)
}

function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) loadFile(file)
}

function onDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave(e) {
  e.preventDefault()
  isDragging.value = false
}

function onPaste(e) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) loadFile(file)
      break
    }
  }
}

function loadFile(file) {
  errorMsg.value = ''
  if (!file.type.startsWith('image/')) {
    errorMsg.value = '请上传图片文件（JPEG/PNG/WebP/GIF）'
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    errorMsg.value = '图片过大，请选择 20MB 以内的图片'
    return
  }

  isLoading.value = true
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    originalImage.value = img
    originalFileName.value = file.name.replace(/\.[^.]+$/, '')
    originalFileType.value = file.type
    URL.revokeObjectURL(url)
    isLoading.value = false
  }
  img.onerror = () => {
    errorMsg.value = '图片加载失败，请尝试其他文件'
    URL.revokeObjectURL(url)
    isLoading.value = false
  }
  img.src = url
}

function clearImage() {
  originalImage.value = null
  originalFileName.value = ''
  originalFileType.value = ''
  errorMsg.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

// ============================================================
// Download
// ============================================================
function downloadImage() {
  if (!canvasRef.value || !originalImage.value) return

  const canvas = canvasRef.value
  const mime = originalFileType.value || 'image/png'
  const quality = mime === 'image/jpeg' || mime === 'image/webp' ? 0.92 : undefined

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        errorMsg.value = '图片生成失败，请重试'
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = getExtensionFromMime(mime)
      a.download = `${originalFileName.value || 'image'}_watermark.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    },
    mime,
    quality
  )
}

function getExtensionFromMime(mime) {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  return 'jpg'
}
</script>

<template>
  <div class="tool-page" @paste="onPaste">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px">
      <h1>🖼️ 图片水印生成器</h1>
      <AiHelpPanel
        title="图片水印生成器"
        desc="为图片添加仅供指定用途使用的文字水印，支持密度、位置、字体、字号、透明度等调节。"
        :params="[
          { name: 'image', desc: 'Base64 或 URL 图片（暂未支持，仅手动上传）', required: false, example: '' },
          { name: 'middle', desc: '水印中间内容', required: false, example: '华为云资料审核' },
          { name: 'suffix', desc: '水印后缀', required: false, example: '供审核使用' },
          { name: 'density', desc: '水印密度 0-1', required: false, example: '0.5' },
        ]"
      />
    </div>

    <div class="watermark-layout">
      <!-- Left / Top: upload + preview -->
      <div class="watermark-preview-panel card">
        <div
          v-if="!hasImage"
          class="upload-zone"
          :class="{ dragging: isDragging }"
          @click="triggerFileInput"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            style="display:none"
            @change="onFileSelect"
          >
          <div class="upload-hint">
            <div class="upload-icon">📤</div>
            <p>点击上传、拖拽或粘贴图片</p>
            <p class="upload-tip">支持 JPEG / PNG / WebP / GIF，最大 20MB</p>
          </div>
        </div>

        <div v-else class="preview-wrap">
          <canvas ref="canvasRef" class="watermark-canvas"></canvas>
          <button class="btn btn-secondary btn-sm clear-btn" @click="clearImage">
            移除图片
          </button>
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <div v-if="isLoading" class="loading-msg">图片加载中…</div>
      </div>

      <!-- Right / Bottom: controls -->
      <div class="watermark-controls card">
        <div class="control-group">
          <label class="control-label">水印内容</label>
          <div class="watermark-text-input">
            <span class="fixed-prefix">仅供</span>
            <input
              v-model="middleText"
              class="input"
              type="text"
              placeholder="例如：华为云资料审核"
              maxlength="50"
            >
            <select v-model="suffix" class="input suffix-select">
              <option v-for="opt in WATERMARK_SUFFIX_OPTIONS" :key="opt" :value="opt">
                {{ opt }}
              </option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <input
            v-if="suffix === 'custom'"
            v-model="customSuffix"
            class="input"
            type="text"
            placeholder="输入自定义后缀，例如：供内部审计使用"
            maxlength="30"
          >
        </div>

        <div class="control-group">
          <div class="control-header">
            <label class="control-label">水印密度</label>
            <label class="single-mode-toggle">
              <input v-model="isSingleMode" type="checkbox">
              <span>单水印</span>
            </label>
          </div>
          <div class="density-slider-wrap">
            <span>稀疏</span>
            <input
              v-model.number="density"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="density-slider"
            >
            <span>密集</span>
          </div>
        </div>

        <div v-if="isSingle" class="control-group">
          <label class="control-label">单水印设置</label>
          <div class="control-row">
            <select v-model="position" class="input">
              <option v-for="opt in POSITION_OPTIONS" :key="opt.key" :value="opt.key">
                {{ opt.label }}
              </option>
            </select>
            <select v-model="fontKey" class="input">
              <option v-for="opt in FONT_OPTIONS" :key="opt.key" :value="opt.key">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="control-row">
            <label class="inline-label">字号</label>
            <input
              v-model.number="fontSize"
              type="range"
              min="12"
              max="120"
              step="1"
              class="density-slider"
            >
            <input
              v-model.number="fontSize"
              type="number"
              min="12"
              max="120"
              class="input number-input"
            >
            <span class="unit">px</span>
          </div>
        </div>

        <div v-else class="control-group">
          <label class="control-label">平铺水印设置</label>
          <div class="control-row">
            <select v-model="fontKey" class="input">
              <option v-for="opt in FONT_OPTIONS" :key="opt.key" :value="opt.key">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="control-row">
            <label class="inline-label">字号</label>
            <input
              v-model.number="fontSize"
              type="range"
              min="12"
              max="120"
              step="1"
              class="density-slider"
            >
            <input
              v-model.number="fontSize"
              type="number"
              min="12"
              max="120"
              class="input number-input"
            >
            <span class="unit">px</span>
          </div>
        </div>

        <div class="control-group">
          <label class="control-label">样式</label>
          <div class="control-row">
            <input v-model="color" type="color" class="color-picker" title="颜色">
            <label class="inline-label">透明度</label>
            <input
              v-model.number="opacity"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="density-slider"
            >
            <span class="unit">{{ Math.round(opacity * 100) }}%</span>
          </div>
          <div class="control-row">
            <label class="inline-label">旋转</label>
            <input
              v-model.number="rotation"
              type="range"
              min="-90"
              max="90"
              step="1"
              class="density-slider"
            >
            <input
              v-model.number="rotation"
              type="number"
              min="-90"
              max="90"
              class="input number-input"
            >
            <span class="unit">°</span>
          </div>
          <div class="control-row">
            <label class="inline-label">
              <input v-model="isBold" type="checkbox">
              加粗
            </label>
          </div>
        </div>

        <button
          class="btn download-btn"
          :disabled="downloadDisabled"
          @click="downloadImage"
        >
          {{ hasImage ? '下载图片' : '请先上传图片' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.watermark-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.watermark-preview-panel {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.upload-zone {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  padding: 40px 20px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 360px;
}

.upload-zone:hover,
.upload-zone.dragging {
  border-color: var(--accent);
  background: var(--bg-tertiary);
}

.upload-hint {
  text-align: center;
  color: var(--text-secondary);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}

.preview-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.watermark-canvas {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.clear-btn {
  align-self: flex-start;
}

.watermark-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.control-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.single-mode-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}

.watermark-text-input {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.fixed-prefix {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
}

.suffix-select {
  width: auto;
  min-width: 140px;
}

.density-slider-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-muted);
}

.density-slider {
  flex: 1;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.inline-label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.number-input {
  width: 70px;
}

.unit {
  font-size: 13px;
  color: var(--text-muted);
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

.download-btn {
  width: 100%;
  margin-top: 8px;
}

.error-msg {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: var(--radius);
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
  font-size: 13px;
}

.loading-msg {
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 768px) {
  .watermark-layout {
    grid-template-columns: 1fr;
  }

  .watermark-preview-panel {
    min-height: 280px;
  }

  .upload-zone {
    min-height: 240px;
  }

  .watermark-text-input {
    flex-direction: column;
    align-items: stretch;
  }

  .suffix-select {
    width: 100%;
  }
}
</style>
