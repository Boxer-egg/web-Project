/**
 * Text decoration (kaomoji) and zero-width steganography utilities.
 */

export const MODES = [
  { value: 'decorate', label: '颜艺装饰' },
  { value: 'hide', label: '隐藏信息' },
  { value: 'extract', label: '提取信息' }
]

export const DECORATION_TEMPLATES = [
  { name: '可爱', prefix: '(｡･ω･｡)ﾉ♡ ', suffix: ' ♡(｡･ω･｡)' },
  { name: '开心', prefix: '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧ ', suffix: ' ✧ﾟ･: *ヽ(◕ヮ◕ヽ)' },
  { name: '加油', prefix: '٩(•̤̀ᵕ•̤́๑)و ', suffix: ' ٩(•̤̀ᵕ•̤́๑)و' },
  { name: '哭泣', prefix: '(；´Д｀) ', suffix: ' (´；Д；`)' },
  { name: '生气', prefix: '(╬ Ò﹏Ó) ', suffix: ' (╬ Ò﹏Ó)' },
  { name: '猫咪', prefix: '(=^･ω･^=) ', suffix: ' (=^･ω･^=)' },
  { name: '熊', prefix: '(っ˘ڡ˘ς) ', suffix: ' (´･_･`)' }
]

// Zero-width characters used for steganography.
const ZWSP = '​'   // 0
const ZWJ = '‍'    // 1
const ZWNJ = '‌'   // separator between bits and characters

/**
 * Encode a string into binary using UTF-8 bytes.
 * @param {string} text
 * @returns {string}
 */
function stringToBits(text) {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  return Array.from(bytes)
    .map(b => b.toString(2).padStart(8, '0'))
    .join('')
}

/**
 * Decode binary bits back to a UTF-8 string.
 * @param {string} bits
 * @returns {string|null}
 */
function bitsToString(bits) {
  const bytes = []
  for (let i = 0; i < bits.length; i += 8) {
    const chunk = bits.slice(i, i + 8)
    if (chunk.length !== 8) break
    bytes.push(parseInt(chunk, 2))
  }
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    return decoder.decode(new Uint8Array(bytes))
  } catch {
    return null
  }
}

/**
 * Hide a secret message inside a carrier text using zero-width characters.
 * @param {string} carrier
 * @param {string} secret
 * @returns {string}
 */
export function hideSecret(carrier, secret) {
  const bits = stringToBits(secret)
  const hidden = bits.replace(/0/g, ZWSP).replace(/1/g, ZWJ)
  return carrier + ZWNJ + hidden + ZWNJ
}

/**
 * Extract a hidden message from text using zero-width characters.
 * @param {string} text
 * @returns {string|null}
 */
export function extractSecret(text) {
  const match = String(text || '').match(new RegExp(`${ZWNJ}([${ZWSP}${ZWJ}]+)${ZWNJ}`))
  if (!match) return null
  const bits = match[1].replace(new RegExp(ZWSP, 'g'), '0').replace(new RegExp(ZWJ, 'g'), '1')
  return bitsToString(bits)
}

/**
 * Decorate text with a kaomoji template.
 * @param {string} text
 * @param {number} templateIndex
 * @returns {string}
 */
export function decorateText(text, templateIndex = 0) {
  const template = DECORATION_TEMPLATES[templateIndex] || DECORATION_TEMPLATES[0]
  return template.prefix + text + template.suffix
}

/**
 * Check whether text contains hidden zero-width data.
 * @param {string} text
 * @returns {boolean}
 */
export function hasHiddenData(text) {
  return /[​‌‍]/.test(String(text || ''))
}
