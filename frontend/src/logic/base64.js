/**
 * Base64 logic for encoding and decoding.
 */

export function utf8ToBase64(str) {
  if (!str) return ''
  const bytes = new TextEncoder().encode(str)
  const bin = String.fromCharCode(...bytes)
  return btoa(bin)
}

export function base64ToUtf8(str) {
  if (!str) return ''
  const bin = atob(str)
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function detectBase64(str) {
  if (!str || !str.trim()) return false
  const s = str.trim()
  return /^[A-Za-z0-9+/]*={0,2}$/.test(s) && s.length % 4 === 0 && s.length > 4
}
