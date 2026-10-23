/**
 * Pinyin conversion utilities using pinyin-pro.
 */

import { pinyin, segment as pinyinSegment, OutputFormat } from 'pinyin-pro'

export const TONE_MODES = [
  { value: 'tone', label: '带声调' },
  { value: 'none', label: '无声调' },
  { value: 'first', label: '首字母' }
]

/**
 * Convert Chinese text to pinyin.
 * @param {string} text
 * @param {object} options
 * @param {'tone'|'none'|'first'} options.tone
 * @param {boolean} options.segment
 * @param {boolean} options.preserveNonChinese
 * @returns {{pinyin: string, chineseCount: number, nonChineseCount: number}}
 */
export function convertToPinyin(
  text,
  { tone = 'tone', segment = false, preserveNonChinese = true } = {}
) {
  const input = String(text || '')

  let chineseCount = 0
  let nonChineseCount = 0
  for (const ch of input) {
    if (/[一-龥]/.test(ch)) chineseCount++
    else nonChineseCount++
  }

  const pattern = tone === 'first' ? 'first' : 'pinyin'
  const toneType = tone === 'tone' ? 'symbol' : 'none'
  const nonZh = preserveNonChinese ? 'consecutive' : 'removed'

  let result
  if (segment) {
    // pinyin-pro's `segment()` groups characters into words. Re-run each
    // Chinese segment through `pinyin()` so tone/pattern options still apply.
    const segments = pinyinSegment(input, {
      format: OutputFormat.AllSegment,
      toneType,
      nonZh
    })
    result = ''
    let previousWasChinese = false
    for (const item of segments) {
      if (/[\u4e00-\u9fa5]/.test(item.origin)) {
        const part = pinyin(item.origin, {
          pattern,
          toneType,
          type: 'string',
          nonZh
        }).replace(/\s+/g, '')
        if (result && previousWasChinese) result += ' '
        result += part
        previousWasChinese = true
      } else {
        result += item.origin
        previousWasChinese = false
      }
    }
  } else {
    result = pinyin(input, {
      pattern,
      toneType,
      type: 'string',
      nonZh
    })
  }

  return {
    pinyin: result,
    chineseCount,
    nonChineseCount
  }
}

/**
 * Convert Chinese text to a character-pinyin pair list for side-by-side display.
 * @param {string} text
 * @param {object} options
 * @param {'tone'|'none'|'first'} options.tone
 * @param {boolean} options.segment
 * @param {boolean} options.preserveNonChinese
 * @returns {{pairs: Array<{char: string, pinyin: string, isZh: boolean}>, chineseCount: number, nonChineseCount: number}}
 */
export function convertToPinyinPairs(
  text,
  { tone = 'tone', segment = false, preserveNonChinese = true } = {}
) {
  const input = String(text || '')

  let mode = 'normal'
  if (tone === 'none') mode = 'normal'
  else if (tone === 'tone') mode = 'tone'
  else if (tone === 'first') mode = 'first'

  let chineseCount = 0
  let nonChineseCount = 0
  for (const ch of input) {
    if (/[一-龥]/.test(ch)) chineseCount++
    else nonChineseCount++
  }

  const result = pinyin(input, {
    mode,
    toneType: tone === 'tone' ? 'symbol' : 'none',
    type: 'all',
    segment,
    nonZh: preserveNonChinese ? 'consecutive' : 'removed'
  })

  const pairs = result.map((item) => ({
    char: item.origin,
    pinyin: tone === 'first' ? item.first : item.pinyin,
    isZh: item.isZh
  }))

  return {
    pairs,
    chineseCount,
    nonChineseCount
  }
}
