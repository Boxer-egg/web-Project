/**
 * Preset watermark suffix options.
 */
export const WATERMARK_SUFFIX_OPTIONS = [
  '供审核使用',
  '供备案使用',
  '供留存存档使用',
  '供提交一次性资料使用',
  '供内部审计使用',
  '供资质核验使用',
  '供招标评审使用',
  '供合规审查使用',
  '供财务对账使用',
  '供身份验证使用',
]

/**
 * Font presets for watermark text.
 */
export const FONT_OPTIONS = [
  { key: 'system', label: '系统默认', family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { key: 'simsun', label: '宋体', family: 'SimSun, "Songti SC", serif' },
  { key: 'simhei', label: '黑体', family: 'SimHei, "Heiti SC", sans-serif' },
  { key: 'kaiti', label: '楷体', family: 'KaiTi, "Kaiti SC", serif' },
  { key: 'yahei', label: '微软雅黑', family: '"Microsoft YaHei", "PingFang SC", sans-serif' },
]

/**
 * Single watermark position presets.
 */
export const POSITION_OPTIONS = [
  { key: 'top-left', label: '左上' },
  { key: 'top-center', label: '中上' },
  { key: 'top-right', label: '右上' },
  { key: 'center-left', label: '左中' },
  { key: 'center', label: '居中' },
  { key: 'center-right', label: '右中' },
  { key: 'bottom-left', label: '左下' },
  { key: 'bottom-center', label: '中下' },
  { key: 'bottom-right', label: '右下' },
]

/**
 * Assemble the full watermark text from fixed prefix, user middle text, and suffix.
 * @param {string} prefix - Fixed prefix, e.g. '仅供'.
 * @param {string} middle - User-provided middle content.
 * @param {string} suffix - Selected or custom suffix.
 * @returns {string} The assembled watermark text.
 */
export function buildWatermarkText(prefix, middle, suffix) {
  return `${prefix}${String(middle || '').trim()}${String(suffix || '').trim()}`
}

/**
 * Convert a density slider value (0..1) to a grid of rows and columns.
 * @param {number} density - Slider value in [0, 1].
 * @param {number} min - Minimum rows/cols for non-zero density.
 * @param {number} max - Maximum rows/cols for full density.
 * @returns {{ rows: number, cols: number }}
 */
export function densityToGrid(density, min = 1, max = 10) {
  const clamped = Math.max(0, Math.min(1, Number(density) || 0))
  if (clamped === 0) return { rows: 1, cols: 1 }
  const steps = max - min + 1
  const value = min + Math.floor(clamped * (steps - 1))
  return { rows: value, cols: value }
}

/**
 * Calculate the top-left coordinate for a single watermark by position.
 * @param {string} position - One of POSITION_OPTIONS keys.
 * @param {number} canvasW - Canvas width.
 * @param {number} canvasH - Canvas height.
 * @param {number} textW - Measured text width.
 * @param {number} textH - Text height (font size).
 * @param {number} padding - Padding from edges.
 * @returns {{ x: number, y: number }}
 */
export function calcSinglePosition(position, canvasW, canvasH, textW, textH, padding = 20) {
  let x = padding
  let y = padding

  const [vertical, horizontal = 'center'] = String(position || 'center').split('-')

  if (horizontal === 'center') x = (canvasW - textW) / 2
  else if (horizontal === 'right') x = canvasW - textW - padding

  if (vertical === 'center') y = (canvasH - textH) / 2
  else if (vertical === 'bottom') y = canvasH - textH - padding

  return { x: Math.round(x), y: Math.round(y) }
}

/**
 * Get CSS font-family string for a font option key.
 * @param {string} key - FONT_OPTIONS key.
 * @returns {string}
 */
export function fontFamilyOption(key) {
  const option = FONT_OPTIONS.find(f => f.key === key)
  return option ? option.family : FONT_OPTIONS[0].family
}
