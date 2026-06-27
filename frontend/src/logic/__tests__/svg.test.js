import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatSvg, minifySvg, insertShape, getShapeTemplates } from '../svg.js'

describe('svg', () => {
  it('formats svg with indentation', () => {
    const input = '<svg><rect width="100"/></svg>'
    const result = formatSvg(input)
    assert.ok(result.includes('\n'))
    assert.ok(result.includes('  <rect'))
  })

  it('minifies svg', () => {
    const input = '<svg>\n  <!-- comment -->\n  <rect width="100" />\n</svg>'
    const result = minifySvg(input)
    assert.equal(result, '<svg><rect width="100"/></svg>')
  })

  it('inserts shape at cursor', () => {
    const input = '<svg>\n</svg>'
    const result = insertShape(input, 'rect', 6)
    assert.ok(result.includes('<rect'))
  })

  it('returns shape templates', () => {
    const templates = getShapeTemplates()
    assert.ok(Object.keys(templates).includes('rect'))
    assert.ok(templates.rect.includes('<rect'))
  })

  it('validates formatSvg input type', () => {
    assert.throws(() => formatSvg(null), TypeError)
  })

  it('validates minifySvg input type', () => {
    assert.throws(() => minifySvg(null), TypeError)
  })
})
