/**
 * JWT logic.
 */

export function base64UrlDecode(str) {
  if (!/^[A-Za-z0-9_-]+$/.test(str)) {
    throw new Error('非法字符')
  }
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - str.length % 4) % 4
  str += '='.repeat(pad)
  const binary = atob(str)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** 将 exp/iat/nbf 时间戳值转换为 ISO 字符串；无法解析时返回 null。 */
function toDateStr(val) {
  if (val === undefined || val === null) return null
  if (typeof val === 'number') {
    const d = new Date(val * 1000)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }
  if (typeof val === 'string') {
    const n = Number(val)
    if (!isNaN(n) && val.trim() !== '') {
      const d = new Date(n * 1000)
      if (!isNaN(d.getTime())) return d.toISOString()
    }
  }
  return null
}

/** 解析单个 JWT，返回 header/payload/signature 三部分的结构化结果。 */
export function decodeToken(token) {
  let t = (token || '').trim()
  // 边界：解析第一行（多行输入时仅解析第一行）
  t = t.split('\n')[0]
  // 边界：去除内部换行/空格
  t = t.replace(/\s+/g, '')
  if (t.toLowerCase().startsWith('bearer')) t = t.slice(6)

  const parts = t.split('.')
  const result = {
    raw: parts,
    header: { raw: '', decoded: null, error: null, hasSignature: true },
    payload: { raw: '', decoded: null, error: null },
    signature: '',
    hasSignature: true,
    expired: '',
    expDate: '',
    iatDate: '',
    nbfDate: ''
  }

  if (parts.length === 2) {
    // 无签名：header.payload
    result.hasSignature = false
    result.header.raw = parts[0]
    result.payload.raw = parts[1]
  } else if (parts.length === 3) {
    result.header.raw = parts[0]
    result.payload.raw = parts[1]
    result.signature = parts[2]
  } else {
    throw new Error('JWT 格式错误：应包含 header.payload.signature 三部分')
  }

  try {
    result.header.decoded = JSON.parse(base64UrlDecode(result.header.raw))
  } catch (e) {
    result.header.error = e.message === '非法字符'
      ? '解码失败：Header 包含非法字符'
      : '该部分解码后不是有效的 JSON'
  }

  try {
    result.payload.decoded = JSON.parse(base64UrlDecode(result.payload.raw))
    const p = result.payload.decoded
    if (p && typeof p === 'object') {
      if (p.exp !== undefined) {
        const exp = Number(p.exp)
        if (!isNaN(exp) && typeof p.exp !== 'object') {
          const expMs = exp * 1000
          const now = Date.now()
          result.expired = expMs < now ? '已过期' :
            expMs - now < 86400000 ? '即将过期（24小时内）' : '未过期'
          result.expDate = new Date(expMs).toISOString()
        } else {
          result.expired = ''
        }
      }
      result.iatDate = toDateStr(p.iat) || ''
      result.nbfDate = toDateStr(p.nbf) || ''
    }
  } catch (e) {
    result.payload.error = e.message === '非法字符'
      ? '解码失败：Payload 包含非法字符'
      : '该部分解码后不是有效的 JSON'
  }

  return result
}

/** 旧接口兼容：返回结构化的 header/payload/signature 及日期信息。 */
export function decode(token) {
  if (!token) return null
  const r = decodeToken(token)

  return {
    headerRaw: r.header.raw,
    payloadRaw: r.payload.raw,
    header: r.header.decoded !== null ? r.header.decoded : r.header.raw,
    payload: r.payload.decoded !== null ? r.payload.decoded : r.payload.raw,
    headerError: r.header.error || '',
    payloadError: r.payload.error || '',
    signature: r.signature,
    hasSignature: r.hasSignature,
    expired: r.expired,
    expDate: r.expDate,
    iatDate: r.iatDate,
    nbfDate: r.nbfDate
  }
}