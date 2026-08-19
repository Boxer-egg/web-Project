/**
 * Storefront sign editor pure logic.
 *
 * Handles physical-unit conversion, preset definitions, snapping,
 * spacing measurements, and bounding-box math.
 */

export const DEFAULT_WIDTH = 300
export const DEFAULT_HEIGHT = 80
export const MIN_WIDTH = 10
export const MAX_WIDTH = 1000
export const MIN_HEIGHT = 10
export const MAX_HEIGHT = 500

export const SIZE_PRESETS = [
  { key: 'standard', label: '标准横版门头', width: 300, height: 80 },
  { key: 'small', label: '小型横版', width: 200, height: 60 },
  { key: 'large', label: '大型横版', width: 500, height: 120 },
  { key: 'vertical', label: '竖版灯箱', width: 80, height: 200 },
  { key: 'square', label: '方形灯箱', width: 100, height: 100 },
  { key: 'custom', label: '自定义', width: null, height: null },
]

export const FONT_OPTIONS = [
  { key: 'system', label: '系统默认', family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji"' },
  { key: 'simsun', label: '宋体', family: 'SimSun, "Songti SC", "STSong", serif' },
  { key: 'simhei', label: '黑体', family: 'SimHei, "Heiti SC", "STHeiti", sans-serif' },
  { key: 'kaiti', label: '楷体', family: 'KaiTi, "Kaiti SC", "STKaiti", serif' },
  { key: 'yahei', label: '微软雅黑', family: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif' },
]

export const GRID_SPACING_OPTIONS = [5, 10, 20, 50]
export const MARGIN_OPTIONS = [5, 10, 15, 20]

/**
 * Clamp a number between min and max.
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Validate and clamp sign dimensions.
 */
export function sanitizeDimensions(width, height) {
  return {
    width: clamp(Number(width) || DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH),
    height: clamp(Number(height) || DEFAULT_HEIGHT, MIN_HEIGHT, MAX_HEIGHT),
  }
}

/**
 * Compute the scale factor to fit the physical sign into a pixel viewport.
 */
export function computeScale(signWidth, signHeight, viewportWidth, viewportHeight, padding = 40) {
  if (!signWidth || !signHeight || !viewportWidth || !viewportHeight) return 1
  const availableW = Math.max(1, viewportWidth - padding * 2)
  const availableH = Math.max(1, viewportHeight - padding * 2)
  return Math.min(availableW / signWidth, availableH / signHeight)
}

/**
 * Convert physical cm to screen pixels.
 */
export function cmToPx(cm, scale) {
  return cm * scale
}

/**
 * Convert screen pixels to physical cm.
 */
export function pxToCm(px, scale) {
  return px / scale
}

/**
 * DPI conversion: 1 inch = 2.54 cm.
 */
export function cmToPxAtDpi(cm, dpi) {
  return (cm / 2.54) * dpi
}

/**
 * Return the bounding box of an element in physical coordinates.
 */
export function getElementBounds(el) {
  const halfW = (el.width || 0) / 2
  const halfH = (el.height || 0) / 2
  const rad = ((el.rotation || 0) * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const rotatedW = halfW * cos + halfH * sin
  const rotatedH = halfW * sin + halfH * cos
  return {
    left: el.x + halfW - rotatedW,
    top: el.y + halfH - rotatedH,
    right: el.x + halfW + rotatedW,
    bottom: el.y + halfH + rotatedH,
  }
}

/**
 * Snap a value to the nearest target within a threshold.
 * Returns { value, snapped }.
 */
export function snapValue(value, targets, threshold) {
  let nearest = null
  let minDist = Infinity
  for (const t of targets) {
    const dist = Math.abs(value - t)
    if (dist < minDist && dist <= threshold) {
      minDist = dist
      nearest = t
    }
  }
  return nearest !== null ? { value: nearest, snapped: true } : { value, snapped: false }
}

/**
 * Compute snap targets and snapped position for an element being dragged.
 *
 * @param {object} el - element with x, y, width, height, rotation
 * @param {object} sign - { width, height }
 * @param {array} others - other elements
 * @param {number} gridSpacing - physical grid spacing in cm
 * @param {number} threshold - physical snap threshold in cm
 * @param {boolean} enableSnap - master snap switch
 */
export function snapElement(el, sign, others, gridSpacing, threshold, enableSnap) {
  if (!enableSnap) return { x: el.x, y: el.y, guides: [] }

  const bounds = getElementBounds(el)
  const elW = bounds.right - bounds.left
  const elH = bounds.bottom - bounds.top

  const centerX = bounds.left + elW / 2
  const centerY = bounds.top + elH / 2

  const horizontalTargets = [0, sign.width / 2, sign.width]
  const verticalTargets = [0, sign.height / 2, sign.height]

  // Add grid lines
  if (gridSpacing > 0) {
    for (let x = 0; x <= sign.width; x += gridSpacing) {
      horizontalTargets.push(x)
    }
    for (let y = 0; y <= sign.height; y += gridSpacing) {
      verticalTargets.push(y)
    }
  }

  // Add other element edges and centers
  for (const other of others) {
    if (other.id === el.id) continue
    const ob = getElementBounds(other)
    horizontalTargets.push(ob.left, ob.left + (ob.right - ob.left) / 2, ob.right)
    verticalTargets.push(ob.top, ob.top + (ob.bottom - ob.top) / 2, ob.bottom)
  }

  // Try snapping left/center/right and top/center/bottom
  const candidates = [
    { edge: 'left', offset: bounds.left - el.x, targetOffset: 0 },
    { edge: 'centerX', offset: centerX - el.x, targetOffset: 0 },
    { edge: 'right', offset: bounds.right - el.x, targetOffset: 0 },
  ]

  let bestX = el.x
  let bestXGuide = null
  let minXDist = Infinity

  for (const c of candidates) {
    const current = c.edge === 'left' ? bounds.left : c.edge === 'centerX' ? centerX : bounds.right
    const snap = snapValue(current, horizontalTargets, threshold)
    if (snap.snapped) {
      const dist = Math.abs(current - snap.value)
      if (dist < minXDist) {
        minXDist = dist
        bestX = snap.value - c.offset
        bestXGuide = { type: 'x', value: snap.value, edge: c.edge }
      }
    }
  }

  const yCandidates = [
    { edge: 'top', offset: bounds.top - el.y, targetOffset: 0 },
    { edge: 'centerY', offset: centerY - el.y, targetOffset: 0 },
    { edge: 'bottom', offset: bounds.bottom - el.y, targetOffset: 0 },
  ]

  let bestY = el.y
  let bestYGuide = null
  let minYDist = Infinity

  for (const c of yCandidates) {
    const current = c.edge === 'top' ? bounds.top : c.edge === 'centerY' ? centerY : bounds.bottom
    const snap = snapValue(current, verticalTargets, threshold)
    if (snap.snapped) {
      const dist = Math.abs(current - snap.value)
      if (dist < minYDist) {
        minYDist = dist
        bestY = snap.value - c.offset
        bestYGuide = { type: 'y', value: snap.value, edge: c.edge }
      }
    }
  }

  const guides = []
  if (bestXGuide) guides.push(bestXGuide)
  if (bestYGuide) guides.push(bestYGuide)

  return { x: bestX, y: bestY, guides }
}

/**
 * Calculate distance measurements from an element to the sign edges.
 */
export function measureEdgeDistances(el, sign) {
  const b = getElementBounds(el)
  return {
    left: b.left,
    top: b.top,
    right: sign.width - b.right,
    bottom: sign.height - b.bottom,
  }
}

/**
 * Calculate spacing between two elements.
 * Returns { horizontal: number|null, vertical: number|null }.
 */
export function measureSpacing(a, b) {
  const ab = getElementBounds(a)
  const bb = getElementBounds(b)

  let horizontal = null
  if (ab.top < bb.bottom && ab.bottom > bb.top) {
    horizontal = ab.left <= bb.left ? bb.left - ab.right : ab.left - bb.right
  }

  let vertical = null
  if (ab.left < bb.right && ab.right > bb.left) {
    vertical = ab.top <= bb.top ? bb.top - ab.bottom : ab.top - bb.bottom
  }

  return { horizontal: horizontal !== null ? Math.max(0, horizontal) : null, vertical: vertical !== null ? Math.max(0, vertical) : null }
}

/**
 * Generate a unique ID.
 */
export function uid(prefix = 'el') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Create a default text element.
 */
export function createTextElement(type = 'heading', signWidth = DEFAULT_WIDTH, signHeight = DEFAULT_HEIGHT) {
  const isHeading = type === 'heading'
  return {
    id: uid('text'),
    type: 'text',
    name: isHeading ? '店名' : '副标题',
    text: isHeading ? '店名' : '副标题',
    x: signWidth / 2 - (isHeading ? 80 : 60),
    y: signHeight / 2 - (isHeading ? 15 : 6),
    width: isHeading ? 160 : 120,
    height: isHeading ? 40 : 12,
    rotation: 0,
    fontSize: isHeading ? 40 : 12,
    fontFamily: FONT_OPTIONS[0].key,
    color: '#000000',
    bold: false,
    vertical: false,
  }
}

/**
 * Create a default logo element.
 */
export function createLogoElement(signWidth = DEFAULT_WIDTH, signHeight = DEFAULT_HEIGHT) {
  return {
    id: uid('logo'),
    type: 'logo',
    name: 'Logo',
    x: signWidth / 2 - 25,
    y: signHeight / 2 - 25,
    width: 50,
    height: 50,
    rotation: 0,
    src: '',
    originalSrc: '',
    removeBackground: false,
    removeThreshold: 30,
    replaceColor: false,
    targetColor: '#000000',
    replacementColor: '#000000',
  }
}

/**
 * Get CSS font-family string for a font key.
 */
export function fontFamilyFor(key) {
  const option = FONT_OPTIONS.find((f) => f.key === key)
  return option ? option.family : FONT_OPTIONS[0].family
}

/**
 * Format a physical value with unit.
 */
export function formatCm(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return ''
  return `${value.toFixed(decimals)} cm`
}
