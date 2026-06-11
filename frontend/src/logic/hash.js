/**
 * Hash calculation logic.
 */
import md5 from 'js-md5'

export async function computeHash(algo, input) {
  if (!input) return ''
  
  // Handle both string and ArrayBuffer
  if (algo === 'md5') {
    return md5(input)
  }
  
  let data
  if (typeof input === 'string') {
    data = new TextEncoder().encode(input)
  } else {
    data = input // ArrayBuffer
  }

  const map = { 
    sha1: 'SHA-1', 
    sha256: 'SHA-256', 
    sha512: 'SHA-512' 
  }
  const webAlgo = map[algo] || algo.toUpperCase().replace('SHA', 'SHA-')
  
  const hash = await crypto.subtle.digest(webAlgo, data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function calculateAll(input, algos) {
  const results = {}
  for (const algo of algos) {
    try {
      results[algo] = await computeHash(algo, input)
    } catch (e) {
      results[algo] = '计算失败: ' + e.message
    }
  }
  return results
}
