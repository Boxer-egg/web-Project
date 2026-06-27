import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { minifyCss } from '../cssMinifier.js'

describe('cssMinifier', () => {
  it('throws TypeError for non-string input', () => {
    assert.throws(() => minifyCss(123), TypeError)
    assert.throws(() => minifyCss(null), TypeError)
    assert.throws(() => minifyCss({}), TypeError)
    assert.throws(() => minifyCss(undefined), TypeError)
  })

  it('removes comments and whitespace', () => {
    const input = `/* header */\nbody {\n  margin: 0;\n  color: #333;\n}`
    const result = minifyCss(input)
    assert.equal(result.css, 'body{margin:0;color:#333}')
  })

  it('calculates size stats', () => {
    const input = 'body { margin: 0; }'
    const result = minifyCss(input)
    assert.equal(result.originalLength, 19)
    assert.equal(result.minifiedLength, 14)
    assert.ok(result.savedPercent.includes('%'))
  })

  it('minifies colors when enabled', () => {
    const input = 'a { color: #ffffff; }'
    const result = minifyCss(input, { minifyColor: true })
    assert.equal(result.css, 'a{color:#fff}')
  })

  it('minifies zero values when enabled', () => {
    const input = 'div { margin: 0px; padding: 0em; }'
    const result = minifyCss(input, { minifyZero: true })
    assert.equal(result.css, 'div{margin:0;padding:0}')
  })

  it('removes empty rules when enabled', () => {
    const input = 'a {} body { margin: 0; }'
    const result = minifyCss(input, { removeEmpty: true })
    assert.equal(result.css, 'body{margin:0}')
  })
})
