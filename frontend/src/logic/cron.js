const SPRING_ALIASES = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *'
}

export const cronDialects = ['unix', 'quartz', 'spring']

/**
 * Normalize a cron expression (resolve Spring aliases, determine field count).
 * @param {string} expr
 * @param {string} dialect
 * @returns {{fields: string[], hasSeconds: boolean}}
 */
function normalize(expr, dialect) {
  let clean = expr.trim()
  if (dialect === 'spring' && SPRING_ALIASES[clean]) {
    clean = SPRING_ALIASES[clean]
  }
  const fields = clean.split(/\s+/)
  const hasSeconds = dialect === 'quartz' || (dialect === 'unix' && fields.length === 6)
  if (dialect === 'quartz' && fields.length === 5) {
    fields.unshift('0')
  }
  if (dialect === 'unix' && fields.length === 6) {
    fields.shift()
  }
  return { fields, hasSeconds }
}

/**
 * Parse a cron expression and return description/validity.
 * @param {string} expr
 * @param {string} [dialect='unix']
 * @returns {{valid: boolean, description?: string, error?: string}}
 */
export function parseCron(expr, dialect = 'unix') {
  if (typeof expr !== 'string') return { valid: false, error: '表达式必须是字符串' }
  if (!expr.trim()) return { valid: false, error: '表达式为空' }
  if (!cronDialects.includes(dialect)) return { valid: false, error: `不支持的方言: ${dialect}` }

  const { fields } = normalize(expr, dialect)
  if (fields.length !== 5 && fields.length !== 6) {
    return { valid: false, error: `字段数错误: ${fields.length}` }
  }

  const ranges = dialect === 'quartz'
    ? [[0, 59], [0, 59], [0, 23], [1, 31], [1, 12], [0, 6]]
    : [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]]

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i]
    if (!f) return { valid: false, error: `字段 ${i + 1} 为空` }
    if (!/^[\d*,/\-?LW#]+$/.test(f)) {
      return { valid: false, error: `字段 ${i + 1} 包含非法字符: ${f}` }
    }
    if (f !== '*' && f !== '?' && !isValidField(f, ranges[i])) {
      return { valid: false, error: `字段 ${i + 1} 超出有效范围: ${f}` }
    }
  }

  return { valid: true, description: describeCron(fields) }
}

function isValidField(pattern, [min, max]) {
  if (pattern === '*' || pattern === '?') return true
  if (pattern.includes(',')) {
    return pattern.split(',').every(p => isValidField(p.trim(), [min, max]))
  }
  if (pattern.includes('/')) {
    const [start] = pattern.split('/')
    if (start === '*') return true
    return isValidField(start, [min, max])
  }
  if (pattern.includes('-')) {
    const [lo, hi] = pattern.split('-').map(Number)
    return lo >= min && hi <= max && lo <= hi
  }
  const n = parseInt(pattern, 10)
  return !Number.isNaN(n) && n >= min && n <= max
}

function describeCron(fields) {
  const [min, hour, dom, month, dow] = fields
  const minuteDesc = min === '*' ? '每分钟' : `${min} 分`
  const hourDesc = hour === '*' ? '每小时' : `${hour} 点`
  const domDesc = dom === '*' ? '每天' : `${dom} 日`
  const monthDesc = month === '*' ? '每月' : `${month} 月`
  const dowDesc = dow === '*' || dow === '?' ? '' : ` 周 ${dow}`
  return `${monthDesc}${domDesc} ${hourDesc} ${minuteDesc}${dowDesc} 执行`.trim()
}

/**
 * Generate next N execution datetimes from a cron expression.
 * @param {string} expr
 * @param {string} [dialect='unix']
 * @param {number} [count=5]
 * @returns {string[]}
 */
export function getNextExecutions(expr, dialect = 'unix', count = 5) {
  if (typeof expr !== 'string') throw new TypeError('expr must be a string')
  if (!Number.isInteger(count) || count <= 0) throw new TypeError('count must be a positive integer')

  const now = new Date()
  const results = []
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0)
  const maxMs = 366 * 24 * 60 * 60 * 1000

  while (results.length < count) {
    current.setMinutes(current.getMinutes() + 1)
    if (matchesExpression(current, expr, dialect)) {
      results.push(current.toISOString().slice(0, 19).replace('T', ' '))
    }
    if (current - now > maxMs) break
  }

  return results
}

function matchesExpression(date, expr, dialect) {
  const { fields } = normalize(expr, dialect)
  if (fields.length < 5) return false
  const [min, hour, dom, month, dow] = fields
  return matchField(date.getMinutes(), min, 0, 59) &&
         matchField(date.getHours(), hour, 0, 23) &&
         matchField(date.getDate(), dom, 1, 31) &&
         matchField(date.getMonth() + 1, month, 1, 12) &&
         matchField(date.getDay(), dow, 0, 6)
}

function matchField(value, pattern, min, max) {
  if (pattern === '*' || pattern === '?') return true
  if (pattern.includes(',')) {
    return pattern.split(',').some(p => matchField(value, p.trim(), min, max))
  }
  if (pattern.includes('/')) {
    const [start, step] = pattern.split('/')
    const from = start === '*' ? min : parseInt(start, 10)
    const s = parseInt(step, 10)
    if (Number.isNaN(from) || Number.isNaN(s) || s === 0) return false
    return (value - from) % s === 0 && value >= from
  }
  if (pattern.includes('-')) {
    const [lo, hi] = pattern.split('-').map(Number)
    return value >= lo && value <= hi
  }
  return value === parseInt(pattern, 10)
}

/**
 * Generate a cron expression from simple options.
 * @param {Object} options
 * @param {string} options.freq - second, minute, hour, day, week, month
 * @param {number} [options.interval=1]
 * @param {string} [options.at='']
 * @returns {{expr: string, description: string}}
 */
export function generateCron({ freq, interval = 1, at = '' }) {
  if (typeof freq !== 'string') throw new TypeError('freq must be a string')
  const iv = Number.isInteger(interval) && interval > 0 ? interval : 1
  const parts = at.split(':').map(s => s.trim())
  const hour = parts[0] ? String(parseInt(parts[0], 10)) : '*'
  const minute = parts[1] ? String(parseInt(parts[1], 10)) : '0'

  switch (freq) {
    case 'second':
      return { expr: `*/${iv} * * * *`, description: `每 ${iv} 秒执行（Cron 秒级需 Quartz 方言）` }
    case 'minute':
      return { expr: `*/${iv} * * * *`, description: `每 ${iv} 分钟执行` }
    case 'hour':
      return { expr: `0 */${iv} * * *`, description: `每 ${iv} 小时执行` }
    case 'day':
      return { expr: `${minute} ${hour} * * *`, description: `每天 ${at || '00:00'} 执行` }
    case 'week':
      return { expr: `${minute} ${hour} * * 1`, description: `每周一 ${at || '00:00'} 执行` }
    case 'month':
      return { expr: `${minute} ${hour} 1 * *`, description: `每月 1 日 ${at || '00:00'} 执行` }
    default:
      return { expr: '0 0 * * *', description: '每天执行' }
  }
}
