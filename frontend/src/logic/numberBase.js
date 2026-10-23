/**
 * Number base conversion utilities shared by the UI and the Pages Function API.
 * Supports bases 2–62, negative numbers, and decimal fractions (base 10 only).
 */

export const BASE_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/** Return the numeric value of a digit, preserving case for bases above 36. */
function digitValue(ch, base) {
  const c = base <= 36 ? ch.toUpperCase() : ch
  return BASE_CHARS.indexOf(c)
}

/**
 * Parse a string in `base` into a decimal number.
 * @param {string} numStr
 * @param {number} base
 * @returns {number}
 */
export function parseToNumber(numStr, base) {
  if (!Number.isInteger(base) || base < 2 || base > 62) {
    throw new Error('进制必须在 2~62 之间')
  }

  let s = String(numStr).trim()
  const neg = s.startsWith('-')
  if (neg || s.startsWith('+')) s = s.slice(1)

  if (!s) throw new Error('请输入数字')
  if (base !== 10 && s.includes('.')) throw new Error('非十进制不支持小数')

  let intPart = s
  let fracPart = null
  if (s.includes('.')) {
    const parts = s.split('.')
    intPart = parts[0] || '0'
    fracPart = parts[1]
    if (!fracPart) throw new Error('小数点后缺少数字')
  }

  let value = 0
  for (const ch of intPart) {
    const d = digitValue(ch, base)
    if (d < 0 || d >= base) throw new Error(`字符 "${ch}" 不是有效的 ${base} 进制数字`)
    value = value * base + d
  }

  if (fracPart !== null) {
    let f = 0
    let factor = 1 / base
    for (const ch of fracPart) {
      const d = digitValue(ch, base)
      if (d < 0 || d >= base) throw new Error(`字符 "${ch}" 不是有效的 ${base} 进制数字`)
      f += d * factor
      factor /= base
    }
    value += f
  }

  return neg ? -value : value
}

/** Convert an integer to a string in `base`. */
function intToStr(value, base) {
  if (value === 0) return '0'
  const neg = value < 0
  let v = Math.abs(Math.trunc(value))
  let out = ''
  while (v > 0) {
    out = BASE_CHARS[v % base] + out
    v = Math.floor(v / base)
  }
  return (neg ? '-' : '') + out
}

/**
 * Format a decimal number in `base`.
 * @param {number} value
 * @param {number} base
 * @returns {string}
 */
export function formatNumber(value, base) {
  if (!Number.isInteger(base) || base < 2 || base > 62) {
    throw new Error('进制必须在 2~62 之间')
  }
  if (!Number.isFinite(value)) throw new Error('无法转换非有限数字')

  if (!Number.isInteger(value)) {
    if (base === 10) return String(value)

    const intPart = Math.trunc(value)
    let f = Math.abs(value - intPart)
    let fracStr = ''
    let guard = 0
    while (f > 1e-10 && guard < 16) {
      f *= base
      const digit = Math.floor(f)
      fracStr += BASE_CHARS[digit]
      f -= digit
      guard++
    }
    return intToStr(intPart, base) + (fracStr ? '.' + fracStr : '')
  }

  return intToStr(value, base)
}

/** Normalize full-width digits, minus sign and decimal point. */
export function normalizeNumberInput(value) {
  return String(value || '')
    .replace(/[\uff10-\uff19]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\uff0d/g, '-')
    .replace(/\uff0e/g, '.')
}

/**
 * Convert a number from one base to several target bases.
 * @param {string} numStr
 * @param {number} fromBase
 * @param {number[]} toBases
 * @returns {{ decimal: number, fromBase: number, results: Record<string, string> } | { error: string }}
 */
export function convertNumber(numStr, fromBase = 10, toBases = [2, 8, 16]) {
  let n = normalizeNumberInput(numStr).trim()
  if (!n) return { error: '请输入要转换的数字' }

  let base = Number(fromBase)
  const prefix = n.match(/^(-?)0([xXbBoO])(.+)$/)
  if (prefix) {
    const kind = prefix[2].toLowerCase()
    n = prefix[1] + prefix[3]
    base = kind === 'x' ? 16 : kind === 'b' ? 2 : 8
  }

  if (!Number.isInteger(base) || base < 2 || base > 62) {
    return { error: 'from 进制必须在 2~62 之间' }
  }

  const bases = (Array.isArray(toBases) ? toBases : [toBases])
    .map(Number)
    .filter(b => Number.isInteger(b) && b >= 2 && b <= 62)
  if (!bases.length) return { error: 'to 至少需要一个 2~62 之间的进制' }

  let decimal
  try {
    decimal = parseToNumber(n, base)
  } catch (e) {
    return { error: e.message }
  }

  const results = {}
  for (const b of bases) {
    try {
      results[`base${b}`] = formatNumber(decimal, b)
    } catch (e) {
      return { error: e.message }
    }
  }

  return { decimal, fromBase: base, results }
}
