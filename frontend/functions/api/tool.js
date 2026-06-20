import { handleOptions, parseParams, jsonOk, jsonError } from '../_shared/handler.js'
import * as base64Logic from '../../src/logic/base64.js'
import * as urlLogic from '../../src/logic/url.js'
import * as regexLogic from '../../src/logic/regex.js'
import * as uuidLogic from '../../src/logic/uuid.js'
import * as jsonCsvLogic from '../../src/logic/json-csv.js'
import * as textDiffLogic from '../../src/logic/text-diff.js'
import * as textToolboxLogic from '../../src/logic/text-toolbox.js'
import * as wordCounterLogic from '../../src/logic/word-counter.js'
import * as chineseConverterLogic from '../../src/logic/chinese-converter.js'
import * as loremLogic from '../../src/logic/lorem.js'
import * as dateLogic from '../../src/logic/date.js'
import * as passwordLogic from '../../src/logic/password.js'
import * as bmiLogic from '../../src/logic/bmi.js'
import { marked } from 'marked'
import yaml from 'js-yaml'
import QRCode from 'qrcode'
import { evaluate as calcEvaluate } from '../../src/logic/calculator'
import { generateBatch as randomGenerateBatch } from '../../src/logic/random'
import { convert as numberToChinese } from '../../src/logic/numberChinese'
import { search as zipPlateAreaSearch } from '../../src/data/zipPlateArea'
import { search as garbageSearch } from '../../src/data/garbageData'
import { calculateInheritance as calculateBloodType } from '../../src/logic/bloodType'
import { calculateRelationship } from '../../src/logic/relationship'

/** Normalize a boolean-ish query param. */
function boolParam(val, defaultValue = false) {
  if (val === undefined || val === null || val === '') return defaultValue
  return String(val) === '1' || String(val).toLowerCase() === 'true'
}

/** Normalize an integer query param with min/max clamping. */
function intParam(val, defaultValue, min, max) {
  const n = parseInt(val, 10)
  if (isNaN(n)) return defaultValue
  return Math.max(min, Math.min(max, n))
}

/** Convert CSS absolute units to px. */
function cssToPx(val, unit, ctx) {
  const n = parseFloat(val)
  if (isNaN(n)) return NaN
  switch (unit) {
    case 'px': return n
    case 'rem': return n * ctx.rootFont
    case 'em': return n * ctx.parentFont
    case 'vh': return n * ctx.viewportH / 100
    case 'vw': return n * ctx.viewportW / 100
    case '%': return n * ctx.parentFont / 100
    case 'pt': return n * 4 / 3
    case 'pc': return n * 16
    case 'in': return n * 96
    case 'cm': return n * 37.795
    case 'mm': return n * 3.7795
    default: return n
  }
}

/** Convert px to a CSS unit. */
function pxToCss(pxVal, unit, ctx) {
  switch (unit) {
    case 'px': return pxVal
    case 'rem': return pxVal / ctx.rootFont
    case 'em': return pxVal / ctx.parentFont
    case 'vh': return pxVal / ctx.viewportH * 100
    case 'vw': return pxVal / ctx.viewportW * 100
    case '%': return pxVal / ctx.parentFont * 100
    case 'pt': return pxVal * 3 / 4
    case 'pc': return pxVal / 16
    case 'in': return pxVal / 96
    case 'cm': return pxVal / 37.795
    case 'mm': return pxVal / 3.7795
    default: return pxVal
  }
}

const CSS_UNITS = ['px', 'rem', 'em', 'vh', 'vw', '%', 'pt', 'pc', 'in', 'cm', 'mm']

/** Color helpers. */
function parseHex(hex) {
  let h = (hex || '').trim()
  if (h.startsWith('#')) h = h.slice(1)
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) return null
  return {
    hex: '#' + h.toUpperCase(),
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  }
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100
  let r, g, b
  if (s === 0) { r = g = b = l }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** Unit conversion data. */
const UNIT_CATEGORIES = {
  length: {
    units: {
      m: 1, km: 1000, cm: 0.01, mm: 0.001, um: 1e-6, nm: 1e-9,
      inch: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852,
      li: 500, zhang: 3.3333, chi: 0.3333, cun: 0.0333
    }
  },
  weight: {
    units: {
      kg: 1, g: 0.001, mg: 1e-6, t: 1000,
      lb: 0.453592, oz: 0.0283495, jin: 0.5, liang: 0.05
    }
  },
  area: {
    units: {
      m2: 1, km2: 1e6, cm2: 1e-4, ha: 10000, mu: 666.667,
      ft2: 0.092903, ac: 4046.86
    }
  },
  volume: {
    units: {
      l: 1, ml: 0.001, m3: 1000, cm3: 0.001,
      gal_us: 3.78541, qt_us: 0.946353, pt_us: 0.473176, floz_us: 0.0295735
    }
  },
  data: {
    units: {
      b: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776, pb: 1125899906842624,
      kib: 1024, mib: 1048576, gib: 1073741824, tib: 1099511627776
    }
  }
}

function convertTemperature(v, from, to) {
  if (from === to) return v
  let celsius
  if (from === 'c') celsius = v
  else if (from === 'f') celsius = (v - 32) * 5 / 9
  else if (from === 'k') celsius = v - 273.15
  if (to === 'c') return celsius
  if (to === 'f') return celsius * 9 / 5 + 32
  if (to === 'k') return celsius + 273.15
  return celsius
}

function formatNumber(n) {
  if (Math.abs(n) < 0.0001 || Math.abs(n) > 1e9) return n.toExponential(4)
  return parseFloat(n.toPrecision(6)).toString()
}

/** Tool handlers: each receives params and returns a JSON-serializable payload. */
const handlers = {
  url: (p) => {
    const text = p.text || ''
    if (!text) throw new Error('缺少 text 参数')
    let output = text
    if (text.includes('%')) {
      try {
        const decoded = urlLogic.decode(text)
        if (decoded !== text) output = decoded
      } catch { /* encode fallback */ }
    } else {
      output = urlLogic.encode(text)
    }
    return { input: text, output, params: urlLogic.parseParams(output) }
  },

  regex: (p) => {
    const text = p.text || ''
    const pattern = p.pattern || ''
    if (!pattern) throw new Error('缺少 pattern 参数')
    const { matches, error } = regexLogic.testRegex(text, pattern, p.flags || 'g')
    if (error) throw new Error(error)
    return { text, pattern, flags: p.flags || 'g', matches }
  },

  uuid: (p) => {
    const count = intParam(p.count, 5, 1, 100)
    const format = (p.format || 'standard').toLowerCase()
    const prefix = p.prefix || ''
    const suffix = p.suffix || ''
    const opts = {
      noHyphen: format === 'nohyphen',
      uppercase: format === 'uppercase',
      prefix,
      suffix,
      quote: format === 'quoted' ? "'" : ''
    }
    const uuids = format === 'array'
      ? [`[${uuidLogic.generateBatch(count, { quote: "'" }).join(', ')}]`]
      : uuidLogic.generateBatch(count, opts)
    return { count, format, prefix, suffix, uuids }
  },

  json_csv: (p) => {
    const data = p.data || ''
    if (!data) throw new Error('缺少 data 参数')
    const direction = (p.direction || 'json-to-csv').toLowerCase()
    const delimiter = p.delimiter || ','
    const includeHeader = boolParam(p.includeHeader, true)
    const output = direction === 'json-to-csv'
      ? jsonCsvLogic.jsonToCsv(data, delimiter, includeHeader)
      : jsonCsvLogic.csvToJson(data, delimiter, includeHeader)
    return { direction, delimiter, includeHeader, output }
  },

  css_unit: (p) => {
    const value = parseFloat(p.value)
    if (isNaN(value)) throw new Error('缺少有效 value 参数')
    const from = (p.from || 'px').toLowerCase()
    const toList = (p.to || 'rem,em').split(',').map(s => s.trim()).filter(Boolean)
    const ctx = {
      rootFont: parseFloat(p.rootFont) || 16,
      parentFont: parseFloat(p.parentFont) || 16,
      viewportW: parseFloat(p.viewportW) || 1920,
      viewportH: parseFloat(p.viewportH) || 1080
    }
    const px = cssToPx(value, from, ctx)
    if (isNaN(px)) throw new Error('无法转换的源单位')
    const results = []
    for (const unit of toList.length ? toList : CSS_UNITS) {
      if (!CSS_UNITS.includes(unit)) continue
      const converted = pxToCss(px, unit, ctx)
      const precision = Math.abs(converted) < 0.01 ? 6 : Math.abs(converted) < 1 ? 4 : 2
      results.push({ unit, value: parseFloat(converted.toFixed(precision)) })
    }
    return { input: { value, from }, ctx, results }
  },

  markdown: (p) => {
    const text = p.text || ''
    if (!text) throw new Error('缺少 text 参数')
    return { html: marked(text, { breaks: true }) }
  },

  text_diff: (p) => {
    const text1 = p.text1 || ''
    const text2 = p.text2 || ''
    const mode = (p.mode || 'line').toLowerCase()
    const ignoreSpace = boolParam(p.ignoreSpace, false)
    const result = mode === 'line'
      ? textDiffLogic.diffLines(text1, text2, ignoreSpace)
      : textDiffLogic.diffChars(text1, text2, ignoreSpace)
    return { mode, ignoreSpace, diff: result }
  },

  text_toolbox: (p) => {
    const text = p.text || ''
    const action = (p.action || 'upper').toLowerCase()
    const map = {
      upper: textToolboxLogic.toUpper,
      lower: textToolboxLogic.toLower,
      capitalize: textToolboxLogic.toCapitalize,
      swapcase: textToolboxLogic.swapCase,
      dedup: textToolboxLogic.removeDuplicateLines,
      noempty: textToolboxLogic.removeEmptyLines,
      trim: textToolboxLogic.trimLines,
      mergeempty: textToolboxLogic.mergeEmptyLines,
      sortasc: textToolboxLogic.sortAsc,
      sortdesc: textToolboxLogic.sortDesc,
      reverselines: textToolboxLogic.reverseLines,
      reversechars: textToolboxLogic.reverseChars,
      addlinenum: textToolboxLogic.addLineNumbers,
      dellinenum: textToolboxLogic.removeLineNumbers,
      tolist: textToolboxLogic.toList,
    }
    const fn = map[action]
    if (!fn) throw new Error(`不支持的操作: ${action}`)
    return { action, output: fn(text) }
  },

  word_counter: (p) => {
    const text = p.text || ''
    return wordCounterLogic.countStats(text)
  },

  chinese_converter: (p) => {
    const text = p.text || ''
    const direction = (p.direction || 's2t').toLowerCase()
    return { direction, output: chineseConverterLogic.convert(text, direction) }
  },

  lorem: (p) => {
    const paragraphs = intParam(p.paragraphs, 3, 1, 100)
    const sentences = intParam(p.sentences, 5, 1, 50)
    return { paragraphs, sentences, output: loremLogic.generate(paragraphs, sentences) }
  },

  color: (p) => {
    const color = parseHex(p.color || p.hex || '#3B82F6')
    if (!color) throw new Error('缺少有效 color/hex 参数')
    const hsl = rgbToHsl(color.r, color.g, color.b)
    return {
      hex: color.hex,
      rgb: { r: color.r, g: color.g, b: color.b },
      cssRgb: `rgb(${color.r}, ${color.g}, ${color.b})`,
      hsl,
      cssHsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    }
  },

  unit_converter: (p) => {
    const value = parseFloat(p.value)
    if (isNaN(value)) throw new Error('缺少有效 value 参数')
    const category = (p.category || 'length').toLowerCase()
    const from = (p.from || '').toLowerCase()
    const to = (p.to || '').toLowerCase()
    if (category === 'temperature') {
      if (!from || !to) throw new Error('温度转换需要 from 和 to 参数')
      return { value, category, from, to, result: convertTemperature(value, from, to) }
    }
    const cat = UNIT_CATEGORIES[category]
    if (!cat) throw new Error(`不支持的类别: ${category}`)
    const units = cat.units
    if (!from || !units[from]) throw new Error('缺少或无效的 from 参数')
    if (!to || !units[to]) throw new Error('缺少或无效的 to 参数')
    const result = (value * units[from]) / units[to]
    return { value, category, from, to, result: formatNumber(result) }
  },

  date_calculator: (p) => {
    const date1 = p.date1 || ''
    const date2 = p.date2 || ''
    if (!date1 || !date2) throw new Error('缺少 date1 或 date2 参数')
    return { date1, date2, days: dateLogic.diffDates(date1, date2) }
  },

  password: (p) => {
    const length = intParam(p.length, 16, 4, 64)
    const count = intParam(p.count, 5, 1, 20)
    const opts = {
      length,
      upper: boolParam(p.upper, true),
      lower: boolParam(p.lower, true),
      numbers: boolParam(p.number, true),
      symbols: boolParam(p.special, false),
      excludeSimilar: boolParam(p.similar, false)
    }
    const passwords = []
    for (let i = 0; i < count; i++) passwords.push(passwordLogic.generate(opts))
    return { length, count, options: opts, passwords }
  },

  qrcode: async (p) => {
    const text = p.text || ''
    if (!text) throw new Error('缺少 text 参数')
    const svg = await QRCode.toString(text, {
      type: 'svg',
      width: intParam(p.size, 256, 64, 1024),
      margin: intParam(p.margin, 2, 0, 8),
      errorCorrectionLevel: (p.level || 'M').toUpperCase(),
      color: { dark: p.fg || '#000000', light: p.bg || '#ffffff' }
    })
    return { text, svg }
  },

  bmi: (p) => {
    const weight = parseFloat(p.weight)
    const height = parseFloat(p.height)
    if (isNaN(weight) || isNaN(height)) throw new Error('缺少有效 weight 和 height 参数')
    return bmiLogic.calculate(weight, height)
  },

  calculator: (p) => {
    const expr = p.expr || ''
    if (!expr) throw new Error('缺少 expr 参数')
    return { expr, result: calcEvaluate(expr) }
  },

  random: (p) => {
    const type = (p.type || 'int').toLowerCase()
    const opts = {
      min: parseFloat(p.min) || 1,
      max: parseFloat(p.max) || 100,
      count: intParam(p.count, 5, 1, 100),
      unique: boolParam(p.unique, false),
      length: intParam(p.length, 8, 1, 128),
      prefix: p.prefix || '',
      suffix: p.suffix || ''
    }
    return { type, ...opts, results: randomGenerateBatch(type, opts) }
  },

  yaml_json: (p) => {
    const input = p.input || ''
    const direction = (p.direction || 'yaml2json').toLowerCase()
    const compact = boolParam(p.compact, false)
    if (!input) throw new Error('缺少 input 参数')
    if (direction === 'yaml2json') {
      const doc = yaml.load(input)
      return { direction, output: compact ? JSON.stringify(doc) : JSON.stringify(doc, null, 2) }
    }
    const data = JSON.parse(input)
    return { direction, output: yaml.dump(data, { indent: 2, flowLevel: compact ? 0 : -1, noRefs: true }) }
  },

  number_chinese: (p) => {
    const number = p.number || ''
    const mode = (p.mode || 'upper').toLowerCase()
    if (!number) throw new Error('缺少 number 参数')
    return { number, mode, output: numberToChinese(number, mode) }
  },

  led_marquee: (p) => {
    return {
      text: p.text || '加油',
      speed: intParam(p.speed, 5, 1, 10),
      color: p.color || '#ff0000',
      bg: p.bg || '#000000',
      size: intParam(p.size, 120, 12, 800),
      direction: (p.direction || 'left').toLowerCase()
    }
  },

  zip_plate_area: (p) => {
    const type = (p.type || 'zip').toLowerCase()
    const q = p.q || ''
    if (!q) throw new Error('缺少 q 参数')
    return { type, q, results: zipPlateAreaSearch(type, q) }
  },

  garbage: (p) => {
    const q = p.q || ''
    if (!q) throw new Error('缺少 q 参数')
    return { q, results: garbageSearch(q) }
  },

  shelf_life: (p) => {
    const date = p.date || ''
    const value = parseFloat(p.value)
    const unit = (p.unit || 'day').toLowerCase()
    if (!date) throw new Error('缺少 date 参数')
    if (!Number.isFinite(value) || value <= 0) throw new Error('缺少有效 value 参数')
    if (!['day', 'month', 'year'].includes(unit)) throw new Error('unit 必须是 day/month/year')

    const start = new Date(date)
    if (Number.isNaN(start.getTime())) throw new Error('date 格式无效')

    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const v = Math.floor(value)
    if (unit === 'day') d.setDate(d.getDate() + v)
    else if (unit === 'month') d.setMonth(d.getMonth() + v)
    else if (unit === 'year') d.setFullYear(d.getFullYear() + v)

    const today = new Date()
    const msPerDay = 24 * 60 * 60 * 1000
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const daysRemaining = Math.round((d - startToday) / msPerDay)

    return {
      productionDate: date,
      value,
      unit,
      expiryDate: d.toISOString().slice(0, 10),
      daysRemaining
    }
  },

  blood_type: (p) => {
    const parent1 = p.parent1 || ''
    const parent2 = p.parent2 || ''
    if (!parent1) throw new Error('缺少 parent1 参数')
    if (!parent2) throw new Error('缺少 parent2 参数')
    const data = calculateBloodType(parent1, parent2)
    return {
      parent1: data.parent1,
      parent2: data.parent2,
      includeRh: data.includeRh,
      abo: data.abo,
      rh: data.rh,
      full: data.full,
      explanation: data.explanation
    }
  },

  relationship: (p) => {
    const mode = (p.mode || 'query').toLowerCase()
    const sex = parseInt(p.sex, 10) === 0 ? 0 : 1
    const reverse = String(p.reverse || '').toLowerCase() === 'true' || p.reverse === '1'
    const region = (p.region || 'default').toLowerCase()

    if (mode === 'pair') {
      const a = p.a || p.text || ''
      const b = p.b || p.target || ''
      if (!a || !b) throw new Error('pair 模式需要 a/text 和 b/target 参数')
      return calculateRelationship(a, mode, sex, false, region, b)
    }

    const input = mode === 'query' ? (p.chain || '') : (p.title || '')
    if (!input) throw new Error(`缺少 ${mode === 'query' ? 'chain' : 'title'} 参数`)
    return calculateRelationship(input, mode, sex, reverse, region)
  }
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const params = await parseParams(context.request)
  const tool = params.tool
  if (!tool) return jsonError('缺少 tool 参数')

  const handler = handlers[tool]
  if (!handler) return jsonError(`不支持的 tool: ${tool}`, 404)

  try {
    const result = await handler(params)
    return jsonOk({ tool, ...result })
  } catch (e) {
    return jsonError(e.message, 422)
  }
}
