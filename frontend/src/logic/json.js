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
  // If it's valid JSON, unescape as JSON string
  try {
    return JSON.parse(input)
  } catch {
    // fall back to text-level escape handling
  }
  return JSON.parse('"' + input.replace(/"/g, '\\"') + '"')
}

/** Validate JSON and return { ok, error } with a line number for errors. */
export function validate(input) {
  if (!input || !input.trim()) return { ok: false, error: '输入为空' }
  try {
    JSON.parse(input)
    return { ok: true, error: null }
  } catch (e) {
    const msg = String(e.message || '')
    // Try to extract line/column from V8-style error message
    const m = /at position (\d+)/.exec(msg)
    if (m) {
      const pos = parseInt(m[1], 10)
      const before = input.slice(0, pos)
      const line = before.split('\n').length
      const col = before.split('\n').pop().length + 1
      return { ok: false, error: `${msg}（第 ${line} 行，第 ${col} 列）` }
    }
    return { ok: false, error: msg || '无效的 JSON' }
  }
}

export function detectEscaped(str) {
  if (!str || !str.trim()) return false
  const s = str.trim()
  return (s.startsWith('"') && s.endsWith('"')) && (s.includes('\\"') || s.includes('\\n') || s.includes('\\t'))
}
