import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PAGES_DIR = new URL('../frontend/public/data/jk/pages', import.meta.url)
const OUT_FILE = new URL('../frontend/public/data/driving-license-c4.json', import.meta.url)

const OPTION_RE = /^[A-DＡ-Ｄ]、[\s]*/

/**
 * Parse a question text with embedded options separated by <br/>.
 * @param {string} tm
 * @returns {{question: string, options: string[]}}
 */
function parseQuestionAndOptions(tm) {
  const parts = tm.split(/<br\s*\/?>/i)
  const question = parts[0].trim()
  const options = parts
    .slice(1)
    .map(s => s.replace(OPTION_RE, '').trim())
    .filter(Boolean)
  return { question, options }
}

/**
 * Map answer string to option index array.
 * @param {string} da
 * @param {number} tx
 * @returns {number[]}
 */
function parseAnswer(da, tx) {
  if (tx === 1) {
    return da === '错' ? [1] : [0]
  }
  const normalized = da.trim().toUpperCase()
  const indices = []
  for (const ch of normalized) {
    const code = ch.charCodeAt(0)
    let idx
    if (code >= 65 && code <= 68) {
      idx = code - 65
    } else if (code >= 65313 && code <= 65316) {
      idx = code - 65313
    } else {
      continue
    }
    indices.push(idx)
  }
  return indices.sort((a, b) => a - b)
}

/**
 * Determine question type from tx code.
 * @param {number} tx
 * @returns {'single' | 'multiple' | 'truefalse'}
 */
function mapType(tx) {
  if (tx === 1) return 'truefalse'
  if (tx === 3) return 'multiple'
  return 'single'
}

/**
 * Build a stable ID from the source code.
 * @param {string} code
 * @param {number} index
 * @returns {string}
 */
function makeId(code, index) {
  return `jk-${code || String(index).padStart(6, '0')}`
}

/**
 * Convert a source image path (e.g. /tkimg_files/source/kms_2.5.1.jpg)
 * to the local webp asset path under /images/jk.
 * @param {string} tv
 * @param {string} tp
 * @returns {string}
 */
function mapPicture(tv, tp) {
  const raw = tv || tp || ''
  if (!raw) return ''
  const base = raw.split('/').pop().replace(/\.[^.]+$/, '')
  return base ? `/images/jk/${base}.webp` : ''
}

function convert() {
  const files = readdirSync(PAGES_DIR)
    .filter(f => f.startsWith('page-') && f.endsWith('.json'))
    .sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ''), 10)
      const nb = parseInt(b.replace(/\D/g, ''), 10)
      return na - nb
    })

  const questions = []
  for (const file of files) {
    const path = join(PAGES_DIR.pathname, file)
    const list = JSON.parse(readFileSync(path, 'utf-8'))
    if (!Array.isArray(list)) {
      console.warn(`Skipping ${file}: not an array`)
      continue
    }
    for (const item of list) {
      const tx = Number(item.tx) || 2
      const { question, options } = parseQuestionAndOptions(String(item.tm || ''))
      const answer = parseAnswer(String(item.da || ''), tx)
      const finalOptions = tx === 1 ? ['正确', '错误'] : options

      // Skip items with no valid answer.
      if (!answer.length || answer.some(i => i < 0 || i >= finalOptions.length)) {
        console.warn(`Skipping invalid answer: ${item.code} da=${item.da}`)
        continue
      }

      questions.push({
        id: makeId(item.code, questions.length),
        type: mapType(tx),
        question,
        options: finalOptions,
        answer,
        explain: '',
        picture: mapPicture(item.tv, item.tp),
        chapter: item.tags || '综合',
      })
    }
  }

  const bank = {
    meta: {
      subject: 4,
      licenseType: 'C1/C2',
      version: '2026.07',
      total: questions.length,
      passScore: 90,
      examDuration: 45,
    },
    questions,
  }

  writeFileSync(OUT_FILE, JSON.stringify(bank, null, 2), 'utf-8')
  console.log(`Wrote ${questions.length} questions to ${OUT_FILE.pathname}`)
}

convert()
