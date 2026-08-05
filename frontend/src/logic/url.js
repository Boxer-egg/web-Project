/**
 * URL logic for encoding and decoding.
 */

export function encode(str) {
  if (!str) return ''
  return encodeURIComponent(str)
}

/** Encode all non-alphanumeric characters (encodeURIComponent minus unreserved). */
export function encodeAll(str) {
  if (!str) return ''
  return str.replace(/[^A-Za-z0-9._~-]/g, c => encodeURIComponent(c))
}

export function decode(str) {
  if (!str) return ''
  return decodeURIComponent(str)
}

/** Process each non-empty line independently, join with newline. */
export function mapLines(str, fn) {
  if (!str) return ''
  return str
    .split('\n')
    .map(line => (line.trim() ? fn(line) : line))
    .join('\n')
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
      result.push({ key, value: value === '' && !search.split('&').includes(`${key}=`) ? '(无值)' : value })
    }
    return result
  } catch {
    return []
  }
}
