import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildWatermarkText,
  densityToGrid,
  calcSinglePosition,
  fontFamilyOption,
  WATERMARK_SUFFIX_OPTIONS,
  FONT_OPTIONS,
  POSITION_OPTIONS,
} from '../src/logic/imageWatermark.js'

test('buildWatermarkText assembles fixed format', () => {
  const result = buildWatermarkText('仅供', '华为云资料审核', '供审核使用')
  assert.equal(result, '仅供华为云资料审核供审核使用')
})

test('buildWatermarkText trims whitespace', () => {
  const result = buildWatermarkText('仅供', '  华为云  ', '  供审核使用  ')
  assert.equal(result, '仅供华为云供审核使用')
})

test('densityToGrid maps 0 to single watermark', () => {
  const result = densityToGrid(0)
  assert.deepEqual(result, { rows: 1, cols: 1 })
})

test('densityToGrid maps 0.5 to medium grid', () => {
  const result = densityToGrid(0.5)
  assert.deepEqual(result, { rows: 5, cols: 5 })
})

test('densityToGrid maps 1 to max grid', () => {
  const result = densityToGrid(1)
  assert.deepEqual(result, { rows: 10, cols: 10 })
})

test('calcSinglePosition centers text', () => {
  const result = calcSinglePosition('center', 1000, 800, 200, 40, 20)
  assert.deepEqual(result, { x: 400, y: 380 })
})

test('calcSinglePosition places top-left with padding', () => {
  const result = calcSinglePosition('top-left', 1000, 800, 200, 40, 20)
  assert.deepEqual(result, { x: 20, y: 20 })
})

test('calcSinglePosition places bottom-right with padding', () => {
  const result = calcSinglePosition('bottom-right', 1000, 800, 200, 40, 20)
  assert.deepEqual(result, { x: 780, y: 740 })
})

test('fontFamilyOption returns system default stack', () => {
  const result = fontFamilyOption('system')
  assert.ok(result.includes('system-ui'))
})

test('WATERMARK_SUFFIX_OPTIONS contains required presets', () => {
  assert.ok(WATERMARK_SUFFIX_OPTIONS.includes('供审核使用'))
  assert.ok(WATERMARK_SUFFIX_OPTIONS.includes('供备案使用'))
  assert.ok(WATERMARK_SUFFIX_OPTIONS.includes('供留存存档使用'))
  assert.ok(WATERMARK_SUFFIX_OPTIONS.includes('供提交一次性资料使用'))
})

test('POSITION_OPTIONS contains 9 positions', () => {
  assert.equal(POSITION_OPTIONS.length, 9)
})
