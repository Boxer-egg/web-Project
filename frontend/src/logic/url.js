/**
 * URL logic for encoding and decoding.
 */

export function encode(str) {
  if (!str) return ''
  return encodeURIComponent(str)
}

export function decode(str) {
  if (!str) return ''
  return decodeURIComponent(str)
}

export function parseParams(url) {
  if (!url) return []
  try {
    let search = ''
    if (url.includes('?')) {
      search = url.split('?')[1]
    } else if (url.includes('=') && !url.includes('/')) {
      search = url
    } else {
      return []
    }
    
    const params = new URLSearchParams(search)
    const result = []
    for (const [key, value] of params.entries()) {
      result.push({ key, value })
    }
    return result
  } catch {
    return []
  }
}
