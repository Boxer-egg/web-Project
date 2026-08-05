/**
 * HTML Entity logic.
 */

const NAMED_ENTITIES = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;',
  '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;',
}
const EBMD_ENTITIES = { ' ': '&nbsp;' }
const REVERSE_ENTITIES = Object.fromEntries(
  Object.entries(NAMED_ENTITIES).map(([k, v]) => [v, k])
)
const REVERSE_NBSP = Object.fromEntries(
  Object.entries(EBMD_ENTITIES).map(([k, v]) => [v, k])
)
const ENTITY_PATTERN = /&(?:#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g

/** True when the char is part of an already-encoded entity (used to avoid double-encoding). */
function isAsciiPrintable(char) {
  const code = char.charCodeAt(0)
  return code >= 32 && code <= 126
}

export function encodeNamed(str, options = {}) {
  if (!str) return ''
  const onlyNonAscii = !!options.onlyNonAscii
  let text = str
  // Avoid double-encoding existing entities
  text = text.replace(ENTITY_PATTERN, (m) => {
    return `\u0000${m}\u0000`
  })
  for (const entry of Object.entries(NAMED_ENTITIES)) {
    const [char, entity] = entry
    if (onlyNonAscii && isAsciiPrintable(char)) continue
    text = text.split(char).join(entity)
  }
  // 仅在“仅编码非 ASCII”关闭且需要显示时空格 → &nbsp;
  return text.replace(/\u0000/g, '')
}

export function encodeNumeric(str, options = {}) {
  if (!str) return ''
  const onlyNonAscii = !!options.onlyNonAscii
  let result = ''
  const chars = str.split('')
  let i = 0
  while (i < chars.length) {
    // Skip existing entities
    const remaining = chars.slice(i).join('')
    const m = ENTITY_PATTERN.exec(remaining)
    if (m && m.index === 0) {
      result += m[0]
      i += m[0].length
      ENTITY_PATTERN.lastIndex = 0
      continue
    }
    const char = chars[i]
    if (onlyNonAscii && isAsciiPrintable(char)) {
      result += char
      i++
      continue
    }
    result += `&#${char.codePointAt(0)};`
    i++
  }
  return result
}

export function encodeHex(str, options = {}) {
  if (!str) return ''
  const onlyNonAscii = !!options.onlyNonAscii
  let result = ''
  const chars = str.split('')
  let i = 0
  while (i < chars.length) {
    const remaining = chars.slice(i).join('')
    const m = ENTITY_PATTERN.exec(remaining)
    if (m && m.index === 0) {
      result += m[0]
      i += m[0].length
      ENTITY_PATTERN.lastIndex = 0
      continue
    }
    const char = chars[i]
    if (onlyNonAscii && isAsciiPrintable(char)) {
      result += char
      i++
      continue
    }
    result += `&#x${char.codePointAt(0).toString(16).toUpperCase()};`
    i++
  }
  return result
}

export function decode(str) {
  if (!str) return ''
  let text = str
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    const code = parseInt(hex, 16)
    try {
      return code > 0x10ffff ? _ : String.fromCodePoint(code)
    } catch {
      return _
    }
  })
  text = text.replace(/&#(\d+);/g, (_, dec) => {
    const code = parseInt(dec, 10)
    try {
      return code > 0x10ffff ? _ : String.fromCodePoint(code)
    } catch {
      return _
    }
  })
  for (const [entity, char] of Object.entries(REVERSE_ENTITIES)) {
    text = text.split(entity).join(char)
  }
  for (const [entity, char] of Object.entries(REVERSE_NBSP)) {
    text = text.split(entity).join(char)
  }
  return text
}
