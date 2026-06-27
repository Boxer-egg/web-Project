import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseCron, getNextExecutions, generateCron, cronDialects } from '../cron.js'

describe('cron', () => {
  it('exposes supported dialects', () => {
    assert.deepEqual(cronDialects, ['unix', 'quartz', 'spring'])
  })

  it('parses unix daily expression', () => {
    const result = parseCron('30 8 * * *', 'unix')
    assert.equal(result.valid, true)
    assert.ok(result.description.includes('8'))
    assert.ok(result.description.includes('30'))
  })

  it('detects invalid unix expression with out-of-range minute', () => {
    const result = parseCron('70 * * * *', 'unix')
    assert.equal(result.valid, false)
  })

  it('rejects empty expression', () => {
    const result = parseCron('', 'unix')
    assert.equal(result.valid, false)
  })

  it('parses quartz expression with seconds', () => {
    const result = parseCron('0 30 8 * * ?', 'quartz')
    assert.equal(result.valid, true)
  })

  it('parses spring alias', () => {
    const result = parseCron('@daily', 'spring')
    assert.equal(result.valid, true)
    assert.ok(result.description.includes('0 点'))
  })

  it('generates daily cron', () => {
    const result = generateCron({ freq: 'day', at: '08:30' })
    assert.equal(result.expr, '30 8 * * *')
  })

  it('generates hourly cron', () => {
    const result = generateCron({ freq: 'hour', interval: 2 })
    assert.equal(result.expr, '0 */2 * * *')
  })

  it('returns next executions in YYYY-MM-DD HH:MM:SS format', () => {
    const list = getNextExecutions('0 0 * * *', 'unix', 3)
    assert.equal(list.length, 3)
    assert.ok(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(list[0]))
  })

  it('validates getNextExecutions input types', () => {
    assert.throws(() => getNextExecutions(null, 'unix', 3), TypeError)
    assert.throws(() => getNextExecutions('0 0 * * *', 'unix', 0), TypeError)
  })
})
