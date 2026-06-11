/**
 * Password generation logic.
 */

export function generate({ length = 16, upper = true, lower = true, numbers = true, symbols = true, excludeSimilar = false }) {
  let charset = ''
  let similar = 'Il1O0'
  
  const charMap = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  }

  if (upper) charset += charMap.upper
  if (lower) charset += charMap.lower
  if (numbers) charset += charMap.numbers
  if (symbols) charset += charMap.symbols

  if (excludeSimilar) {
    for (const char of similar) {
      charset = charset.split(char).join('')
    }
  }

  if (!charset) return ''

  let password = ''
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length]
  }
  
  return password
}
