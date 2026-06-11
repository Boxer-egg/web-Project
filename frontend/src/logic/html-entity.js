/**
 * HTML Entity logic.
 */

const NAMED_ENTITIES = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;',
  '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;',
}
const REVERSE_ENTITIES = Object.fromEntries(
  Object.entries(NAMED_ENTITIES).map(([k, v]) => [v, k])
)

export function encodeNamed(str) {
  if (!str) return ''
  let text = str
  for (const [char, entity] of Object.entries(NAMED_ENTITIES)) {
    text = text.split(char).join(entity)
  }
  return text
}

export function encodeNumeric(str) {
  if (!str) return ''
  let result = ''
  for (const char of str) {
    const code = char.charCodeAt(0)
    result += `&#${code};`
  }
  return result
}

export function encodeHex(str) {
  if (!str) return ''
  let result = ''
  for (const char of str) {
    const code = char.charCodeAt(0)
    result += `&#x${code.toString(16).toUpperCase()};`
  }
  return result
}

export function decode(str) {
  if (!str) return ''
  let text = str
  // Hex entities
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    const code = parseInt(hex, 16)
    return String.fromCodePoint(code)
  })
  // Decimal entities
  text = text.replace(/&#(\d+);/g, (_, dec) => {
    const code = parseInt(dec, 10)
    return String.fromCodePoint(code)
  })
  // Named entities
  for (const [entity, char] of Object.entries(REVERSE_ENTITIES)) {
    text = text.split(entity).join(char)
  }
  return text
}
