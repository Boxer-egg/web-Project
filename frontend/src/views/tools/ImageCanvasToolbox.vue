<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStorage } from '@vueuse/core'
import JSZip from 'jszip'

// ============================================================
// State
// ============================================================
const originalImage = ref(null) // Image object
const originalFileName = ref('')
const originalFileType = ref('')

const pixelateSize = useStorage('canvas-pixelate', 8)
const watermarkText = useStorage('canvas-watermark-text', '')
const watermarkPosition = useStorage('canvas-watermark-pos', 'bottom-right')
const watermarkColor = useStorage('canvas-watermark-color', '#ffffff')
const watermarkSize = useStorage('canvas-watermark-size', 24)

const maxWidth = useStorage('canvas-max-width', 800)
const maxHeight = useStorage('canvas-max-height', 800)
const quality = useStorage('canvas-quality', 0.8)

const outputFormat = useStorage('canvas-format', 'jpeg') // png / jpeg / webp

const isGrayscale = ref(false)
const isBlackWhite = ref(false)
const isPixelate = ref(false)
const isResize = ref(false)
const isWatermark = ref(false)

const isDragging = ref(false)
const errorMsg = ref('')

const canvasRef = ref(null)

// ============================================================
// Constants
// ============================================================
const POSITIONS = [
  { key: 'top-left', label: '左上' },
  { key: 'top-right', label: '右上' },
  { key: 'bottom-left', label: '左下' },
  { key: 'bottom-right', label: '右下' },
  { key: 'center', label: '居中' },
]

// ============================================================
// Computed
// ============================================================
const hasImage = computed(() => !!originalImage.value)

const processedCanvas = computed(() => {
  if (!originalImage.value || !canvasRef.value) return null
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  let w = originalImage.value.naturalWidth
  let h = originalImage.value.naturalHeight

  // Resize
  if (isResize.value && maxWidth.value > 0 && maxHeight.value > 0) {
    const ratio = Math.min(maxWidth.value / w, maxHeight.value / h, 1)
    if (ratio < 1) {
      w = Math.round(w * ratio)
      h = Math.round(h * ratio)
    }
  }

  canvas.width = w
  canvas.height = h

  // Clear
  ctx.clearRect(0, 0, w, h)

  // Draw original
  ctx.drawImage(originalImage.value, 0, 0, w, h)

  // Pixelate
  if (isPixelate.value && pixelateSize.value > 1) {
    const block = Math.max(2, Math.min(100, Math.round(pixelateSize.value)))
    pixelateCanvas(ctx, w, h, block)
  }

  // Grayscale / Black & White
  if (isGrayscale.value || isBlackWhite.value) {
    applyGrayscale(ctx, w, h, isBlackWhite.value)
  }

  // Watermark
  if (isWatermark.value && watermarkText.value) {
    drawWatermark(ctx, w, h)
  }

  return canvas
})

const processedDataUrl = computed(() => {
  if (!processedCanvas.value) return ''
  const mime = formatToMime(outputFormat.value)
  return processedCanvas.value.toDataURL(mime, Math.max(0, Math.min(1, Number(quality.value) || 0.8)))
})

const outputExt = computed(() => {
  if (outputFormat.value === 'jpeg') return 'jpg'
  return outputFormat.value
})

// ============================================================
// Helpers
// ============================================================
function formatToMime(fmt) {
  if (fmt === 'png') return 'image/png'
  if (fmt === 'webp') return 'image/webp'
  return 'image/jpeg'
}

function pixelateCanvas(ctx, w, h, blockSize) {
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return
  tempCanvas.width = w
  tempCanvas.height = h
  tempCtx.drawImage(ctx.canvas, 0, 0, w, h)

  ctx.clearRect(0, 0, w, h)
  ctx.imageSmoothingEnabled = false

  for (let y = 0; y < h; y += blockSize) {
    for (let x = 0; x < w; x += blockSize) {
      const bw = Math.min(blockSize, w - x)
      const bh = Math.min(blockSize, h - y)
      const data = tempCtx.getImageData(x, y, bw, bh).data
      let r = 0, g = 0, b = 0, count = 0
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
        count++
      }
      if (count > 0) {
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(x, y, bw, bh)
      }
    }
  }
  ctx.imageSmoothingEnabled = true
}

function applyGrayscale(ctx, w, h, blackWhite) {
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    const v = blackWhite ? (gray >= 128 ? 255 : 0) : gray
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
  }
  ctx.putImageData(imageData, 0, 0)
}

function drawWatermark(ctx, w, h) {
  const text = String(watermarkText.value || '')
  if (!text) return
  const size = Math.max(8, Math.min(200, Number(watermarkSize.value) || 24))
  ctx.font = `bold ${size}px sans-serif`
  ctx.fillStyle = String(watermarkColor.value || '#ffffff')
  ctx.textBaseline = 'top'

  const metrics = ctx.measureText(text)
  const tw = metrics.width
  const th = size

  const padding = 16
  let x = padding
  let y = padding

  const pos = watermarkPosition.value
  if (pos === 'top-right') x = w - tw - padding
  else if (pos === 'bottom-left') y = h - th - padding
  else if (pos === 'bottom-right') { x = w - tw - padding; y = h - th - padding }
  else if (pos === 'center') { x = (w - tw) / 2; y = (h - th) / 2 }

  ctx.globalAlpha = 0.7
  ctx.fillText(text, x, y)
  ctx.globalAlpha = 1.0
}

// ============================================================
// File handling
// ============================================================
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

function loadFile(file) {
  errorMsg.value = ''
  if (!file.type.startsWith('image/')) {
    errorMsg.value = '请上传图片文件（JPEG/PNG/WebP/GIF）'
    return
  }
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    originalImage.value = img
    originalFileName.value = file.name.replace(/\.[^.]+$/, '')
    originalFileType.value = file.type
    URL.revokeObjectURL(url)
  }
  img.onerror = () => {
    errorMsg.value = '图片加载失败，请尝试其他文件'
    URL.revokeObjectURL(url)
  }
  img.src = url
}

function clearImage() {
  originalImage.value = null
  originalFileName.value = ''
  originalFileType.value = ''
  errorMsg.value = ''
}

// ============================================================
// Download
// ============================================================
function downloadProcessed() {
  if (!processedDataUrl.value) return
  const a = document.createElement('a')
  a.href = processedDataUrl.value
  a.download = `${originalFileName.value || 'image'}-processed.${outputExt.value}`
  a.click()
}

async function downloadNineSlice() {
  if (!originalImage.value) return
  const img = originalImage.value
  const w = img.naturalWidth
  const h = img.naturalHeight
  const cw = Math.floor(w / 3)
  const ch = Math.floor(h / 3)

  const zip = new JSZip()
  const slices = []

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const sx = col * cw
      const sy = row * ch
      const sw = (col === 2) ? (w - cw * 2) : cw
      const sh = (row === 2) ? (h - ch * 2) : ch

      const c = document.createElement('canvas')
      c.width = sw
      c.height = sh
      const ctx = c.getContext('2d')
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
      const mime = formatToMime(outputFormat.value)
      const q = Math.max(0, Math.min(1, Number(quality.value) || 0.8))
      const dataUrl = c.toDataURL(mime, q)
      const base64 = dataUrl.split(',')[1]
      const idx = row * 3 + col + 1
      const ext = outputExt.value
      zip.file(`slice-${idx}.${ext}`, base64, { base64: true })
      slices.push({ idx, dataUrl, width: sw, height: sh })
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${originalFileName.value || 'image'}-9slice.zip`
  a.click()
  URL.revokeObjectURL(url)

  return slices
}

function downloadSingleSlice(dataUrl, idx) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${originalFileName.value || 'image'}-slice-${idx}.${outputExt.value}`
  a.click()
}

// ============================================================
// 9-slice preview
// ============================================================
const nineSlicePreview = computed(() => {
  if (!originalImage.value) return []
  const img = originalImage.value
  const w = img.naturalWidth
  const h = img.naturalHeight
  const cw = Math.floor(w / 3)
  const ch = Math.floor(h / 3)
  const slices = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const sx = col * cw
      const sy = row * ch
      const sw = (col === 2) ? (w - cw * 2) : cw
      const sh = (row === 2) ? (h - ch * 2) : ch
      const c = document.createElement('canvas')
      c.width = sw
      c.height = sh
      const ctx = c.getContext('2d')
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
      slices.push({ idx: row * 3 + col + 1, dataUrl: c.toDataURL('image/png'), width: sw, height: sh })
    }
  }
  return slices
})

// ============================================================
// Lifecycle
// ============================================================
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

onMounted(() => {
  window.addEventListener('paste', onPaste)
})

onUnmounted(() => {
  window.removeEventListener('paste', onPaste)
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🖼️ 图片 Canvas 工具箱</h1>
      <AiHelpPanel
        title="图片 Canvas 工具箱"
        desc="上传图片并进行像素化、灰度/黑白、文字水印、压缩/缩放、九宫格切割、格式转换等操作。支持拖拽上传和粘贴图片。"
        :params="[
          { name: 'pixelate', desc: '像素化块大小', required: false, example: '8' },
          { name: 'grayscale', desc: '是否启用灰度', required: false, example: '1' },
          { name: 'blackwhite', desc: '是否启用黑白', required: false, example: '0' },
          { name: 'watermark', desc: '水印文字', required: false, example: 'Sample' },
          { name: 'position', desc: '水印位置', required: false, example: 'bottom-right' },
          { name: 'maxWidth', desc: '最大宽度', required: false, example: '800' },
          { name: 'maxHeight', desc: '最大高度', required: false, example: '800' },
          { name: 'quality', desc: '输出质量 0-1', required: false, example: '0.8' },
          { name: 'format', desc: '输出格式 png/jpeg/webp', required: false, example: 'jpeg' },
        ]"
      />
    </div>

    <!-- Upload area -->
    <div
      v-if="!hasImage"
      class="upload-area card"
      :class="{ dragging: isDragging }"
      @click="$refs.fileInput.click()"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
    >
      <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileSelect" />
      <div class="upload-icon">🖼️</div>
      <div class="upload-text">点击或拖拽上传图片</div>
      <div class="upload-hint">支持 JPEG、PNG、WebP、GIF，也可直接粘贴图片</div>
    </div>

    <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

    <!-- Main workspace -->
    <div v-if="hasImage" class="workspace">
      <div class="tool-actions-bar">
        <button class="btn btn-secondary btn-sm" @click="clearImage">重新上传</button>
      </div>

      <div class="preview-section card">
        <div class="preview-row">
          <div class="preview-col">
            <label>原图</label>
            <img :src="originalImage.src" class="preview-img" alt="original" />
            <div class="preview-meta">{{ originalImage.naturalWidth }} × {{ originalImage.naturalHeight }}</div>
          </div>
          <div class="preview-col">
            <label>处理后</label>
            <canvas ref="canvasRef" class="preview-canvas" style="display:none"></canvas>
            <img v-if="processedDataUrl" :src="processedDataUrl" class="preview-img" alt="processed" />
            <div v-else class="preview-placeholder">处理中...</div>
            <div class="preview-meta" v-if="processedDataUrl">
              <button class="btn btn-sm" @click="downloadProcessed">下载</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Operations -->
      <div class="operations card">
        <h3>图像处理</h3>

        <div class="op-group">
          <label class="op-toggle">
            <input type="checkbox" v-model="isPixelate" />
            <span>像素化（马赛克）</span>
          </label>
          <div v-if="isPixelate" class="op-control">
            <label>块大小 ({{ pixelateSize }}px)</label>
            <input v-model.number="pixelateSize" type="range" min="2" max="100" step="2" class="input" />
          </div>
        </div>

        <div class="op-group">
          <label class="op-toggle">
            <input type="checkbox" v-model="isGrayscale" />
            <span>灰度</span>
          </label>
        </div>

        <div class="op-group">
          <label class="op-toggle">
            <input type="checkbox" v-model="isBlackWhite" />
            <span>黑白（二值化）</span>
          </label>
        </div>

        <div class="op-group">
          <label class="op-toggle">
            <input type="checkbox" v-model="isWatermark" />
            <span>文字水印</span>
          </label>
          <div v-if="isWatermark" class="op-controls">
            <div class="input-group">
              <label>水印文字</label>
              <input v-model="watermarkText" class="input" placeholder="输入水印文字..." />
            </div>
            <div class="input-row">
              <div class="input-group">
                <label>位置</label>
                <select v-model="watermarkPosition" class="input">
                  <option v-for="p in POSITIONS" :key="p.key" :value="p.key">{{ p.label }}</option>
                </select>
              </div>
              <div class="input-group">
                <label>颜色</label>
                <div class="color-picker">
                  <input v-model="watermarkColor" type="color" class="color-input" />
                  <input v-model="watermarkColor" class="input" />
                </div>
              </div>
              <div class="input-group">
                <label>字号 ({{ watermarkSize }}px)</label>
                <input v-model.number="watermarkSize" type="range" min="8" max="200" step="2" class="input" />
              </div>
            </div>
          </div>
        </div>

        <div class="op-group">
          <label class="op-toggle">
            <input type="checkbox" v-model="isResize" />
            <span>压缩 / 缩放</span>
          </label>
          <div v-if="isResize" class="op-controls">
            <div class="input-row">
              <div class="input-group">
                <label>最大宽度 (px)</label>
                <input v-model.number="maxWidth" type="number" min="1" max="10000" class="input" />
              </div>
              <div class="input-group">
                <label>最大高度 (px)</label>
                <input v-model.number="maxHeight" type="number" min="1" max="10000" class="input" />
              </div>
            </div>
          </div>
        </div>

        <div class="op-group">
          <div class="input-row">
            <div class="input-group">
              <label>输出格式</label>
              <select v-model="outputFormat" class="input">
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            <div class="input-group">
              <label>质量 ({{ Math.round(quality * 100) }}%)</label>
              <input v-model.number="quality" type="range" min="0.1" max="1" step="0.05" class="input" />
            </div>
          </div>
        </div>
      </div>

      <!-- 9-slice -->
      <div class="nine-slice card">
        <div class="nine-slice-header">
          <h3>九宫格切割</h3>
          <button class="btn btn-sm" @click="downloadNineSlice">下载全部 (ZIP)</button>
        </div>
        <div class="nine-grid">
          <div
            v-for="slice in nineSlicePreview"
            :key="slice.idx"
            class="slice-item"
            @click="downloadSingleSlice(slice.dataUrl, slice.idx)"
          >
            <img :src="slice.dataUrl" class="slice-img" :alt="'slice ' + slice.idx" />
            <span class="slice-label">{{ slice.idx }}</span>
            <span class="slice-dim">{{ slice.width }}×{{ slice.height }}</span>
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
  gap: 10px;
}
.tool-header h1 {
  margin: 0;
}

.upload-area {
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  transition: all 0.2s;
}
.upload-area:hover,
.upload-area.dragging {
  border-color: var(--accent);
  background: var(--bg-tertiary);
}
.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.upload-text {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 6px;
}
.upload-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.error-msg {
  color: #ef4444;
  font-size: 14px;
  margin-top: 12px;
}

.tool-actions-bar {
  margin-bottom: 12px;
}

.preview-section {
  margin-bottom: 20px;
  padding: 20px;
}
.preview-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 768px) {
  .preview-row {
    grid-template-columns: 1fr;
  }
}
.preview-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.preview-col label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}
.preview-img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-tertiary);
}
.preview-placeholder {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-tertiary);
}
.preview-meta {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  gap: 8px;
  align-items: center;
}

.operations {
  margin-bottom: 20px;
  padding: 20px;
}
.operations h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.op-group {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.op-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.op-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
  user-select: none;
}
.op-toggle input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.op-control {
  margin-top: 10px;
  padding-left: 26px;
}
.op-controls {
  margin-top: 10px;
  padding-left: 26px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.input-group label {
  font-size: 13px;
  color: var(--text-secondary);
}

.input-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.color-picker {
  display: flex;
  gap: 8px;
  align-items: center;
}
.color-input {
  width: 44px;
  height: 36px;
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.nine-slice {
  margin-bottom: 40px;
  padding: 20px;
}
.nine-slice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}
.nine-slice h3 {
  margin: 0;
  font-size: 16px;
}

.nine-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.slice-item {
  position: relative;
  cursor: pointer;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-tertiary);
  transition: transform 0.2s, border-color 0.2s;
}
.slice-item:hover {
  transform: scale(1.02);
  border-color: var(--accent);
}
.slice-img {
  width: 100%;
  height: auto;
  display: block;
}
.slice-label {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}
.slice-dim {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
