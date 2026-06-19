/**
 * Number to Chinese converter logic.
 */

const UPPER_DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const LOWER_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const UPPER_UNITS = ['', '拾', '佰', '仟']
const LOWER_UNITS = ['', '十', '百', '千']
const BIG_UNITS = ['', '万', '亿', '万亿']

/**
 * Convert an integer part (string) to Chinese upper case.
 * @param {string} intStr - Integer part without sign.
 * @returns {string}
 */
function intToUpper(intStr) {
  if (intStr === '0') return '零'
  let result = ''
  let zeroFlag = false
  const groups = []
  // Split into 4-digit groups from right
  for (let i = intStr.length; i > 0; i -= 4) {
    groups.unshift(intStr.slice(Math.max(0, i - 4), i))
  }
  for (let g = 0; g < groups.length; g++) {
    const group = groups[g]
    let groupRes = ''
    let groupZero = true
    for (let i = 0; i < group.length; i++) {
      const digit = parseInt(group[i], 10)
      const unitIdx = group.length - 1 - i
      if (digit === 0) {
        if (!zeroFlag && !groupZero) {
          groupRes += UPPER_DIGITS[0]
          zeroFlag = true
        }
      } else {
        groupRes += UPPER_DIGITS[digit] + UPPER_UNITS[unitIdx]
        zeroFlag = false
        groupZero = false
      }
    }
    if (groupRes) {
      // Remove trailing zero if any
      groupRes = groupRes.replace(/零+$/, '')
      result += groupRes + BIG_UNITS[groups.length - 1 - g]
    } else if (!result.endsWith('零') && result !== '') {
      result += '零'
    }
  }
  result = result.replace(/零+$/, '')
  if (!result) result = '零'
  return result
}

/**
 * Convert an integer part (string) to Chinese lower case.
 * @param {string} intStr - Integer part without sign.
 * @returns {string}
 */
function intToLower(intStr) {
  if (intStr === '0') return '零'
  let result = ''
  let zeroFlag = false
  const groups = []
  for (let i = intStr.length; i > 0; i -= 4) {
    groups.unshift(intStr.slice(Math.max(0, i - 4), i))
  }
  for (let g = 0; g < groups.length; g++) {
    const group = groups[g]
    let groupRes = ''
    let groupZero = true
    for (let i = 0; i < group.length; i++) {
      const digit = parseInt(group[i], 10)
      const unitIdx = group.length - 1 - i
      if (digit === 0) {
        if (!zeroFlag && !groupZero) {
          groupRes += LOWER_DIGITS[0]
          zeroFlag = true
        }
      } else {
        groupRes += LOWER_DIGITS[digit] + LOWER_UNITS[unitIdx]
        zeroFlag = false
        groupZero = false
      }
    }
    if (groupRes) {
      groupRes = groupRes.replace(/零+$/, '')
      result += groupRes + BIG_UNITS[groups.length - 1 - g]
    } else if (!result.endsWith('零') && result !== '') {
      result += '零'
    }
  }
  result = result.replace(/零+$/, '')
  if (!result) result = '零'
  // Simplify: 一十 -> 十 at start
  if (result.startsWith('一十')) result = result.slice(1)
  return result
}

/**
 * Convert decimal part (string) to Chinese upper case (jiao/fen).
 * @param {string} decStr - Decimal part without leading dot.
 * @returns {string}
 */
function decToUpper(decStr) {
  if (!decStr) return ''
  // Pad or trim to 2 digits
  const d = decStr.padEnd(2, '0').slice(0, 2)
  const jiao = parseInt(d[0], 10)
  const fen = parseInt(d[1], 10)
  let res = ''
  if (jiao !== 0) res += UPPER_DIGITS[jiao] + '角'
  if (fen !== 0) res += UPPER_DIGITS[fen] + '分'
  return res
}

/**
 * Convert decimal part (string) to Chinese lower case.
 * @param {string} decStr - Decimal part without leading dot.
 * @returns {string}
 */
function decToLower(decStr) {
  if (!decStr) return ''
  let res = '点'
  for (const ch of decStr) {
    res += LOWER_DIGITS[parseInt(ch, 10)]
  }
  return res
}

/**
 * Convert a number to Chinese upper case amount (大写金额).
 * @param {number} num
 * @returns {string}
 */
function toUpper(num) {
  if (num === 0) return '零元整'
  const isNegative = num < 0
  const absNum = Math.abs(num)
  const str = absNum.toFixed(2)
  const [intPart, decPart] = str.split('.')
  const intChinese = intToUpper(intPart)
  const decChinese = decToUpper(decPart)
  let result = intChinese + '元'
  if (decChinese) {
    result += decChinese
  } else {
    result += '整'
  }
  if (isNegative) result = '负' + result
  return result
}

/**
 * Convert a number to Chinese lower case reading.
 * @param {number} num
 * @returns {string}
 */
function toLower(num) {
  if (num === 0) return '零'
  const isNegative = num < 0
  const absNum = Math.abs(num)
  const str = String(absNum)
  const [intPart, decPart] = str.split('.')
  const intChinese = intToLower(intPart)
  const decChinese = decPart ? decToLower(decPart) : ''
  let result = intChinese + decChinese
  if (isNegative) result = '负' + result
  return result
}

/**
 * Convert a number to currency format (人民币).
 * @param {number} num
 * @returns {string}
 */
function toCurrency(num) {
  if (isNaN(num)) throw new Error('无效的数字')
  const isNegative = num < 0
  const absNum = Math.abs(num)
  const str = absNum.toFixed(2)
  const parts = str.split('.')
  const intPart = parts[0]
  // Add thousand separators
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const result = '¥' + formattedInt + '.' + parts[1]
  return isNegative ? '-' + result : result
}

/**
 * Convert a number to Chinese representation.
 * @param {number|string} number - Input number or string.
 * @param {string} mode - 'upper' | 'lower' | 'currency'.
 * @returns {string} Converted string.
 * @throws {Error} If input is invalid.
 */
export function convert(number, mode) {
  if (number === '' || number === null || number === undefined) {
    throw new Error('请输入数字')
  }
  const num = typeof number === 'string' ? Number(number) : number
  if (isNaN(num)) {
    throw new Error('无效的数字')
  }
  switch (mode) {
    case 'upper':
      return toUpper(num)
    case 'lower':
      return toLower(num)
    case 'currency':
      return toCurrency(num)
    default:
      throw new Error('未知的转换模式')
  }
}
