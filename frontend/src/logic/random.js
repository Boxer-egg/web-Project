/**
 * Random value generation logic.
 * Uses crypto.getRandomValues for secure int/float generation.
 */

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/**
 * Generate a cryptographically secure random integer in [min, max].
 * @param {number} min - Inclusive minimum.
 * @param {number} max - Inclusive maximum.
 * @returns {number}
 */
export function randomInt(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new Error('min 和 max 必须是有效数字')
  }
  if (min > max) throw new Error('min 不能大于 max')
  const range = max - min + 1
  if (range <= 0) throw new Error('数值范围无效')
  // Use rejection sampling to avoid bias
  const bitsNeeded = Math.ceil(Math.log2(range))
  const bytesNeeded = Math.ceil(bitsNeeded / 8)
  const mask = (1 << bitsNeeded) - 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const buf = new Uint8Array(bytesNeeded)
    crypto.getRandomValues(buf)
    let val = 0
    for (let i = 0; i < bytesNeeded; i++) {
      val = (val << 8) | buf[i]
    }
    val = val & mask
    if (val < range) {
      return min + val
    }
  }
}

/**
 * Generate a random float in [min, max] with up to 4 decimal places.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomFloat(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new Error('min 和 max 必须是有效数字')
  }
  if (min > max) throw new Error('min 不能大于 max')
  const buf = new Uint32Array(2)
  crypto.getRandomValues(buf)
  // 53-bit precision mantissa
  const mantissa = (buf[0] * 0x100000000) + buf[1]
  const fraction = mantissa / (0x100000000 * 0x100000000)
  const raw = min + fraction * (max - min)
  // Round to 4 decimal places
  return Math.round(raw * 10000) / 10000
}

/**
 * Generate a random string.
 * @param {number} length
 * @param {string} [charset]
 * @returns {string}
 */
export function randomString(length, charset = DEFAULT_CHARSET) {
  if (!Number.isFinite(length) || length < 1) throw new Error('长度必须大于 0')
  if (!charset) throw new Error('字符集不能为空')
  const len = charset.length
  const result = []
  for (let i = 0; i < length; i++) {
    const idx = randomInt(0, len - 1)
    result.push(charset[idx])
  }
  return result.join('')
}

/**
 * Generate a UUID v4.
 * @returns {string}
 */
export function randomUuid() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate a random hex color.
 * @returns {string}
 */
export function randomColor() {
  const buf = new Uint8Array(3)
  crypto.getRandomValues(buf)
  return '#' + Array.from(buf, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a batch of random values.
 * @param {string} type - 'int' | 'float' | 'string' | 'uuid' | 'color'
 * @param {Object} options
 * @param {number} [options.min=1]
 * @param {number} [options.max=100]
 * @param {number} [options.count=5]
 * @param {boolean} [options.unique=false]
 * @param {number} [options.length=8]
 * @param {string} [options.prefix='']
 * @param {string} [options.suffix='']
 * @returns {string[]}
 */
export function generateBatch(type, options = {}) {
  const {
    min = 1,
    max = 100,
    count = 5,
    unique = false,
    length = 8,
    prefix = '',
    suffix = ''
  } = options

  if (!Number.isFinite(count) || count < 1) throw new Error('数量必须大于 0')
  if (count > 10000) throw new Error('数量不能超过 10000')

  const results = []

  if (type === 'int') {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new Error('min 和 max 必须是有效数字')
    }
    if (min > max) throw new Error('min 不能大于 max')
    const range = max - min + 1
    if (unique && count > range) {
      throw new Error(`唯一模式下，范围 ${range} 太小，无法生成 ${count} 个不重复整数`)
    }
    const used = new Set()
    let attempts = 0
    while (results.length < count && attempts < count * 100) {
      attempts++
      const val = randomInt(min, max)
      if (unique && used.has(val)) continue
      used.add(val)
      results.push(`${prefix}${val}${suffix}`)
    }
    if (results.length < count) {
      throw new Error('无法生成足够的不重复值')
    }
  } else if (type === 'float') {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new Error('min 和 max 必须是有效数字')
    }
    if (min > max) throw new Error('min 不能大于 max')
    const used = new Set()
    let attempts = 0
    while (results.length < count && attempts < count * 100) {
      attempts++
      const val = randomFloat(min, max)
      if (unique && used.has(val)) continue
      used.add(val)
      results.push(`${prefix}${val}${suffix}`)
    }
    if (results.length < count) {
      throw new Error('无法生成足够的不重复值')
    }
  } else if (type === 'string') {
    if (!Number.isFinite(length) || length < 1) throw new Error('长度必须大于 0')
    const used = new Set()
    let attempts = 0
    while (results.length < count && attempts < count * 100) {
      attempts++
      const val = randomString(length)
      if (unique && used.has(val)) continue
      used.add(val)
      results.push(`${prefix}${val}${suffix}`)
    }
    if (results.length < count) {
      throw new Error('无法生成足够的不重复值')
    }
  } else if (type === 'uuid') {
    for (let i = 0; i < count; i++) {
      results.push(`${prefix}${randomUuid()}${suffix}`)
    }
  } else if (type === 'color') {
    for (let i = 0; i < count; i++) {
      results.push(`${prefix}${randomColor()}${suffix}`)
    }
  } else {
    throw new Error(`不支持的类型: ${type}`)
  }

  return results
}
