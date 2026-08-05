/**
 * Password generation logic.
 */

export function generate({ length = 16, upper = true, lower = true, numbers = true, symbols = true, excludeSimilar = false, ensureEach = false, customCharset = '' }) {
  let charset = ''
  let similar = 'Il1O0'

  const charMap = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  }

  if (customCharset) {
    charset = customCharset
  } else {
    if (upper) charset += charMap.upper
    if (lower) charset += charMap.lower
    if (numbers) charset += charMap.numbers
    if (symbols) charset += charMap.symbols
  }

  if (excludeSimilar) {
    for (const char of similar) {
      charset = charset.split(char).join('')
    }
  }

  if (!charset) return ''

  const randomInt = (max) => {
    // crypto fallback to Math.random for non-secure contexts
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1)
      crypto.getRandomValues(array)
      return array[0] % max
    }
    return Math.floor(Math.random() * max)
  }

  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[randomInt(charset.length)]
  }

  // Ensure each selected category appears at least once
  if (ensureEach && !customCharset) {
    const categories = []
    if (upper) categories.push(charMap.upper)
    if (lower) categories.push(charMap.lower)
    if (numbers) categories.push(charMap.numbers)
    if (symbols) categories.push(charMap.symbols)

    if (categories.length && length >= categories.length) {
      let chars = password.split('')
      for (const cat of categories) {
        const idx = randomInt(chars.length)
        chars[idx] = cat[randomInt(cat.length)]
      }
      // reshuffle to avoid biased positions
      for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1)
        ;[chars[i], chars[j]] = [chars[j], chars[i]]
      }
      password = chars.join('')
    }
  }

  return password
}
