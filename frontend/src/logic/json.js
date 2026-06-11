/**
 * JSON logic for formatting, compressing, and escaping.
 */

export function format(input, indent = 2) {
  if (!input || !input.trim()) return ''
  const obj = JSON.parse(input)
  return JSON.stringify(obj, null, indent)
}

export function compress(input) {
  if (!input || !input.trim()) return ''
  const obj = JSON.parse(input)
  return JSON.stringify(obj)
}

export function escape(input) {
  if (!input || !input.trim()) return ''
  return JSON.stringify(input).slice(1, -1)
}

export function unescape(input) {
  if (!input || !input.trim()) return ''
  return JSON.parse('"' + input + '"')
}

export function detectEscaped(str) {
  if (!str || !str.trim()) return false
  const s = str.trim()
  return (s.startsWith('"') && s.endsWith('"')) && (s.includes('\\"') || s.includes('\\n') || s.includes('\\t'))
}
