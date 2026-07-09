<script setup>
import { ref, watch, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { convertToPinyin, convertToPinyinPairs, TONE_MODES } from '../../logic/pinyin'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const tone = useStorage('pinyin-tone', 'tone')
const segment = useStorage('pinyin-segment', false)
const preserve = useStorage('pinyin-preserve', true)
const stats = ref({ chineseCount: 0, nonChineseCount: 0 })
const input = ref('')

function processor(val) {
  const result = convertToPinyin(val, {
    tone: tone.value,
    segment: segment.value,
    preserveNonChinese: preserve.value
  })
  stats.value = {
    chineseCount: result.chineseCount,
    nonChineseCount: result.nonChineseCount
  }
  return result.pinyin
}

const {
  output,
  error,
  autoMode,
  copyText,
  clearAll,
  loadExample,
  process: convertText,
  copy
} = useTool({
  storageKey: 'pinyin',
  processor,
  paramMapping: {
    text: { ref: input },
    tone: { ref: tone },
    segment: { ref: segment, transform: v => v === '1' },
    preserve: { ref: preserve, transform: v => v === '1' }
  },
  customInput: input,
  example: '你好，世界！重庆欢迎您。'
})

const pairs = computed(() => {
  if (!input.value) return []
  const result = convertToPinyinPairs(input.value, {
    tone: tone.value,
    segment: segment.value,
    preserveNonChinese: preserve.value
  })
  stats.value = {
    chineseCount: result.chineseCount,
    nonChineseCount: result.nonChineseCount
  }
  return result.pairs
})

const previewVisible = ref(false)
const previewDataUrl = ref('')
const exportWidth = ref(1600)

const EXPORT_WIDTHS = [
  { value: 1200, label: '标清 1200px' },
  { value: 1600, label: '高清 1600px' },
  { value: 2400, label: '超清 2400px' },
  { value: 3200, label: '打印 3200px' },
]

function getSiteDomain() {
  try {
    return window.location.hostname || 'vvzzv.com'
  } catch {
    return 'vvzzv.com'
  }
}

function measureText(ctx, text, font) {
  ctx.font = font
  return ctx.measureText(text).width
}

function renderPairsToCanvas(targetWidth = 1600) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const BASE_WIDTH = 800
  const scale = targetWidth / BASE_WIDTH

  const padding = 40 * scale
  const titleHeight = 80 * scale
  const footerHeight = 50 * scale
  const rowGap = 24 * scale
  const cellGapX = 12 * scale
  const cellGapY = 16 * scale
  const cellPaddingX = 10 * scale
  const cellPaddingY = 12 * scale
  const pinyinFont = `${24 * scale}px sans-serif`
  const charFont = `bold ${36 * scale}px sans-serif`
  const nonZhFont = `${36 * scale}px sans-serif`
  const titleFont = `bold ${32 * scale}px sans-serif`
  const subtitleFont = `${18 * scale}px sans-serif`
  const footerFont = `${14 * scale}px sans-serif`
  const maxContentWidth = 720 * scale
  const borderRadius = 8 * scale
  const outerBorderWidth = 8 * scale
  const innerBorderWidth = 2 * scale

  let x = 0
  let rowMaxWidth = 0
  let rowHeight = 0
  const rows = []
  let currentRow = []

  for (const pair of pairs.value) {
    if (pair.char === '\n') {
      if (currentRow.length) {
        rows.push({ items: currentRow, height: rowHeight })
        currentRow = []
        rowHeight = 0
      }
      continue
    }

    const char = pair.char
    const pinyin = pair.isZh ? (pair.pinyin || '') : ''
    const charFontToUse = pair.isZh ? charFont : nonZhFont
    const pinyinWidth = pinyin ? measureText(ctx, pinyin, pinyinFont) : 0
    const charWidth = measureText(ctx, char, charFontToUse)
    const cellWidth = Math.max(pinyinWidth, charWidth) + cellPaddingX * 2
    const cellHeight = (pinyin ? 34 * scale : 0) + 44 * scale + cellPaddingY * 2

    if (x + cellWidth > maxContentWidth && currentRow.length) {
      rows.push({ items: currentRow, height: rowHeight })
      currentRow = []
      x = 0
      rowHeight = 0
    }

    currentRow.push({
      char,
      pinyin,
      width: cellWidth,
      height: cellHeight,
      isZh: pair.isZh
    })
    x += cellWidth + cellGapX
    rowMaxWidth = Math.max(rowMaxWidth, x - cellGapX)
    rowHeight = Math.max(rowHeight, cellHeight)
  }

  if (currentRow.length) {
    rows.push({ items: currentRow, height: rowHeight })
  }

  let totalHeight = titleHeight + padding
  for (const row of rows) {
    totalHeight += row.height + cellGapY
  }
  totalHeight += footerHeight + padding

  canvas.width = targetWidth
  canvas.height = totalHeight

  // Background
  ctx.fillStyle = '#fffdf5'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Border
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = outerBorderWidth
  ctx.strokeRect(10 * scale, 10 * scale, canvas.width - 20 * scale, canvas.height - 20 * scale)

  // Inner border
  ctx.strokeStyle = '#fcd34d'
  ctx.lineWidth = innerBorderWidth
  ctx.strokeRect(22 * scale, 22 * scale, canvas.width - 44 * scale, canvas.height - 44 * scale)

  // Title
  ctx.fillStyle = '#92400e'
  ctx.font = titleFont
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('字音对照', canvas.width / 2, 38 * scale)

  // Subtitle
  ctx.fillStyle = '#78350f'
  ctx.font = subtitleFont
  ctx.fillText(`共 ${stats.value.chineseCount} 个汉字`, canvas.width / 2, 76 * scale)

  // Content
  let y = titleHeight + padding
  for (const row of rows) {
    let rowX = (canvas.width - rowMaxWidth) / 2
    for (const item of row.items) {
      // Cell background
      ctx.fillStyle = item.isZh ? '#fffbeb' : '#f3f4f6'
      roundRect(ctx, rowX, y, item.width, row.height, borderRadius)
      ctx.fill()

      // Cell border
      ctx.strokeStyle = item.isZh ? '#fbbf24' : '#d1d5db'
      ctx.lineWidth = 1.5 * scale
      roundRect(ctx, rowX, y, item.width, row.height, borderRadius)
      ctx.stroke()

      // Pinyin
      if (item.pinyin) {
        ctx.fillStyle = '#4b5563'
        ctx.font = pinyinFont
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(item.pinyin, rowX + item.width / 2, y + cellPaddingY + 17 * scale)
      }

      // Char
      ctx.fillStyle = item.isZh ? '#111827' : '#9ca3af'
      ctx.font = item.isZh ? charFont : nonZhFont
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const charY = item.pinyin ? y + row.height - cellPaddingY - 22 * scale : y + row.height / 2
      ctx.fillText(item.char, rowX + item.width / 2, charY)

      rowX += item.width + cellGapX
    }
    y += row.height + cellGapY
  }

  // Footer
  ctx.fillStyle = '#9ca3af'
  ctx.font = footerFont
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`由 ${getSiteDomain()} 生成，数据仅供参考`, canvas.width / 2, canvas.height - 28 * scale)

  return canvas.toDataURL('image/png')
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function openPreview() {
  if (!pairs.value.length) return
  previewDataUrl.value = renderPairsToCanvas(exportWidth.value)
  previewVisible.value = true
}

function closePreview() {
  previewVisible.value = false
}

function regeneratePreview() {
  if (!pairs.value.length) return
  previewDataUrl.value = renderPairsToCanvas(exportWidth.value)
}

function downloadImage() {
  if (!previewDataUrl.value) return
  const link = document.createElement('a')
  link.href = previewDataUrl.value
  const filename = input.value.slice(0, 20).replace(/\\s+/g, '_') || '字音对照'
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.png`
  link.click()
}

watch([tone, segment, preserve], () => {
  if (autoMode.value) convertText()
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🔤 文字转拼音</h1>
      <AiHelpPanel
        title="文字转拼音"
        desc="将中文文本转换为拼音，支持带声调、无声调、首字母三种模式"
        api-tool="pinyin"
        :params="[
          { name: 'text', desc: '要转换的文本', required: true, example: '你好世界' },
          { name: 'tone', desc: '声调模式：tone / none / first', required: false, example: 'tone' },
          { name: 'segment', desc: '是否按词分词（填 1）', required: false, example: '1' },
          { name: 'preserve', desc: '是否保留非中文字符（填 1）', required: false, example: '1' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="card config-bar">
      <div class="config-row">
        <label v-for="m in TONE_MODES" :key="m.value" class="radio-label">
          <input v-model="tone" type="radio" :value="m.value"> {{ m.label }}
        </label>
        <label class="radio-label">
          <input v-model="segment" type="checkbox"> 分词
        </label>
        <label class="radio-label">
          <input v-model="preserve" type="checkbox"> 保留非中文
        </label>
      </div>
    </div>

    <div class="tool-actions">
      <button class="btn" @click="convertText">转换</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">示例</button>
      <button class="btn btn-secondary" @click="copy">{{ copyText }}</button>
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>

    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入文本</h3>
        <textarea v-model="input" class="textarea" placeholder="输入中文文本..." rows="12"></textarea>
      </div>
      <div class="tool-panel">
        <h3>拼音结果</h3>
        <textarea v-model="output" class="textarea" placeholder="拼音..." rows="12" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self: flex-start">{{ copyText }}</button>
      </div>
    </div>

    <div v-if="pairs.length" class="card pinyin-pairs-card">
      <div class="pairs-header">
        <h3>字音对照</h3>
        <button class="btn btn-sm" @click="openPreview">导出图片</button>
      </div>
      <div class="pinyin-pairs">
        <template v-for="(pair, index) in pairs" :key="index">
          <div v-if="pair.char === '\n'" class="line-break"></div>
          <div v-else class="pinyin-pair" :class="{ 'non-zh': !pair.isZh }">
            <div class="pinyin-text">{{ pair.pinyin || ' ' }}</div>
            <div class="char-text">{{ pair.char }}</div>
          </div>
        </template>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="previewVisible" class="preview-overlay" @click.self="closePreview">
        <div class="preview-dialog">
          <div class="preview-header">
            <h3>图片预览</h3>
            <button class="preview-close" @click="closePreview">×</button>
          </div>
          <div class="preview-body">
            <img v-if="previewDataUrl" :src="previewDataUrl" alt="字音对照预览">
          </div>
          <div class="preview-footer">
            <div class="resolution-selector">
              <label v-for="w in EXPORT_WIDTHS" :key="w.value" class="resolution-option">
                <input v-model="exportWidth" type="radio" :value="w.value" @change="regeneratePreview">
                <span>{{ w.label }}</span>
              </label>
            </div>
            <div class="preview-actions">
              <button class="btn" @click="downloadImage">下载图片</button>
              <button class="btn btn-secondary" @click="closePreview">关闭</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div v-if="input" class="card stats-bar">
      中文字符：{{ stats.chineseCount }} 个｜非中文字符：{{ stats.nonChineseCount }} 个
    </div>

    <div v-if="error" class="error-msg">❌ {{ error }}</div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.config-bar {
  margin-bottom: 16px;
  padding: 12px 16px;
}
.config-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.radio-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
}
.stats-bar {
  margin-top: 16px;
  padding: 10px 16px;
  font-size: 13px;
  color: var(--text-secondary);
}
.pinyin-pairs-card {
  margin-top: 20px;
  padding: 16px;
}
.pairs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.pairs-header h3 {
  margin: 0;
  font-size: 15px;
  color: var(--text-primary);
}
.pinyin-pairs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 4px;
  line-height: 1.4;
}
.pinyin-pair {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 1.2em;
  padding: 2px 4px;
  border-radius: var(--radius);
}
.pinyin-pair.non-zh {
  opacity: 0.7;
}
.pinyin-text {
  font-size: 13px;
  color: var(--text-secondary);
  min-height: 1.4em;
  white-space: nowrap;
}
.char-text {
  font-size: 18px;
  color: var(--text-primary);
}
.line-break {
  flex-basis: 100%;
  height: 0;
}

/* 图片预览弹窗 */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}
.preview-dialog {
  background: var(--bg-primary);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 860px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.preview-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}
.preview-close {
  background: none;
  border: none;
  font-size: 22px;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
}
.preview-body {
  padding: 16px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  background: var(--bg-secondary);
}
.preview-body img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
.resolution-selector {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.resolution-option {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
}
.resolution-option input {
  margin: 0;
}
.preview-actions {
  display: flex;
  gap: 10px;
}
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-top: 10px;
  font-size: 14px;
}
</style>
