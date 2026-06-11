/**
 * JWT logic.
 */

export function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - str.length % 4) % 4
  str += '='.repeat(pad)
  const binary = atob(str)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function decode(token) {
  if (!token) return null
  let t = token.trim()
  if (t.toLowerCase().startsWith('bearer ')) t = t.slice(7)

  const parts = t.split('.')
  if (parts.length !== 3) {
    throw new Error('JWT 格式错误：应包含 header.payload.signature 三部分')
  }

  const result = { signature: parts[2] }

  try {
    result.header = JSON.parse(base64UrlDecode(parts[0]))
  } catch {
    result.header = parts[0]
    result.headerError = 'Header 解码失败'
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
    result.payloadError = 'Payload 解码失败'
  }

  return result
}
