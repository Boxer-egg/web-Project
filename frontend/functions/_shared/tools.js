/**
 * Pure computation functions extracted from Vue tool components.
 * Each function mirrors the logic in the corresponding tool component,
 * working in both browser and Cloudflare Worker environments.
 */

// ─── Base64 ────────────────────────────────────────────
export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str)
  const bin = String.fromCharCode(...bytes)
  return btoa(bin)
}

export function base64ToUtf8(str) {
  const bin = atob(str)
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function detectBase64(str) {
  if (!str || !str.trim()) return false
  const s = str.trim()
  return /^[A-Za-z0-9+/]*={0,2}$/.test(s) && s.length % 4 === 0 && s.length > 4
}

// ─── JWT ───────────────────────────────────────────────
export function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - str.length % 4) % 4
  str += '='.repeat(pad)
  const binary = atob(str)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function jwtDecode(token) {
  let t = token.trim()
  if (t.toLowerCase().startsWith('bearer ')) t = t.slice(7)

  const parts = t.split('.')
  if (parts.length !== 3) {
    return { error: 'JWT 格式错误：应包含 header.payload.signature 三部分' }
  }

  const result = { signature: parts[2] }

  try {
    result.header = JSON.parse(base64UrlDecode(parts[0]))
  } catch {
    result.header = parts[0]
    result.error = 'Header 解码失败'
  }

  try {
    const p = JSON.parse(base64UrlDecode(parts[1]))
    result.payload = p

    if (p.exp) {
      const exp = new Date(p.exp * 1000)
      const now = Date.now()
      result.expired = exp.getTime() < now ? '已过期' :
        exp.getTime() - now < 86400000 ? '即将过期（24小时内）' : '未过期'
      result.expDate = exp.toISOString()
    }
    if (p.iat) {
      result.iatDate = new Date(p.iat * 1000).toISOString()
    }
  } catch {
    result.payload = parts[1]
    result.error = result.error || 'Payload 解码失败'
  }

  return result
}

// ─── JSON ──────────────────────────────────────────────
export function jsonFormat(str, indent = 2) {
  const obj = JSON.parse(str)
  return JSON.stringify(obj, null, indent)
}

// ─── HTML Entity ───────────────────────────────────────
const NAMED_ENTITIES = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;',
  '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;',
}
const REVERSE_ENTITIES = Object.fromEntries(
  Object.entries(NAMED_ENTITIES).map(([k, v]) => [v, k])
)

export function htmlEncodeNamed(str) {
  let text = str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  for (const [char, entity] of Object.entries(NAMED_ENTITIES)) {
    text = text.split(char).join(entity)
  }
  return text
}

export function htmlEncodeNumeric(str) {
  let text = str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  let result = ''
  for (const char of text) {
    result += NAMED_ENTITIES[char] || char.charCodeAt(0) > 127 ? `&#${char.charCodeAt(0)};` : char
  }
  return result
}

export function htmlEncodeHex(str) {
  let text = str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  let result = ''
  for (const char of text) {
    result += NAMED_ENTITIES[char] || char.charCodeAt(0) > 127 ? `&#x${char.charCodeAt(0).toString(16).toUpperCase()};` : char
  }
  return result
}

export function htmlDecode(str) {
  let text = str
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    const code = parseInt(hex, 16)
    return code <= 0x10FFFF ? String.fromCodePoint(code) : `&#x${hex};`
  })
  text = text.replace(/&#(\d+);/g, (_, dec) => {
    const code = parseInt(dec, 10)
    return code <= 0x10FFFF ? String.fromCodePoint(code) : `&#${dec};`
  })
  for (const [entity, char] of Object.entries(REVERSE_ENTITIES)) {
    text = text.split(entity).join(char)
  }
  return text
}

// ─── Hash ──────────────────────────────────────────────
export async function computeHash(algo, text) {
  const data = new TextEncoder().encode(text)
  if (algo === 'md5') {
    // Use Web Crypto compatible MD5 (we import js-md5 for this)
    const { md5 } = await import('js-md5')
    return md5(text)
  }
  const map = { sha1: 'SHA-1', sha256: 'SHA-256', sha512: 'SHA-512' }
  const webAlgo = map[algo]
  if (!webAlgo) throw new Error(`不支持的算法: ${algo}`)
  const hash = await crypto.subtle.digest(webAlgo, data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Timestamp ─────────────────────────────────────────
export function tsToDate(str) {
  const num = parseInt(str)
  if (isNaN(num)) return { error: '请输入有效的数字' }
  const ms = str.length === 10 ? num * 1000 : num
  const d = new Date(ms)
  if (isNaN(d.getTime())) return { error: '无效的时间戳' }
  return {
    iso: d.toISOString(),
    local: formatLocalDate(d),
    unixSeconds: Math.floor(d.getTime() / 1000),
    unixMs: d.getTime(),
    relative: relativeTime(d),
  }
}

export function dateToTs(str) {
  const d = new Date(str)
  if (isNaN(d.getTime())) return { error: '无效的日期' }
  return {
    unixSeconds: Math.floor(d.getTime() / 1000),
    unixMs: d.getTime(),
    iso: d.toISOString(),
  }
}

function formatLocalDate(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function relativeTime(d) {
  const diff = d.getTime() - Date.now()
  const abs = Math.abs(diff)
  const s = Math.floor(abs / 1000)
  if (s < 60) return diff > 0 ? `${s} 秒后` : `${s} 秒前`
  const m = Math.floor(s / 60)
  if (m < 60) return diff > 0 ? `${m} 分钟后` : `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return diff > 0 ? `${h} 小时后` : `${h} 小时前`
  const days = Math.floor(h / 24)
  return diff > 0 ? `${days} 天后` : `${days} 天前`
}

// ─── Number Converter ──────────────────────────────────
export function convertNumber(numStr, fromBase, toBases) {
  let n = numStr.trim()
  // Auto-detect prefix
  if (n.startsWith('0x') || n.startsWith('0X')) { fromBase = 16; n = n.slice(2) }
  else if (n.startsWith('0b') || n.startsWith('0B')) { fromBase = 2; n = n.slice(2) }
  else if (n.startsWith('0o') || n.startsWith('0O')) { fromBase = 8; n = n.slice(2) }

  const decimal = parseInt(n, fromBase)
  if (isNaN(decimal)) return { error: `输入 "${numStr}" 不是有效的 ${fromBase} 进制数字` }

  const results = {}
  for (const base of toBases) {
    results[`base${base}`] = decimal.toString(base).toUpperCase()
  }
  return { decimal, fromBase, results }
}

// ─── Code Formatter ────────────────────────────────────
export async function formatCode(code, lang, indentSize = 2) {
  const beautify = await import('js-beautify')
  const opt = { indent_size: indentSize }

  switch (lang) {
    case 'javascript':
      return beautify.js_beautify(code, opt)
    case 'css':
      return beautify.css_beautify(code, opt)
    case 'html':
      return beautify.html_beautify(code, opt)
    case 'json':
      return JSON.stringify(JSON.parse(code), null, indentSize)
    default:
      return beautify.js_beautify(code, opt)
  }
}
