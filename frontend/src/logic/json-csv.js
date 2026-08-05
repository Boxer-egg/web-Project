/**
 * JSON ↔ CSV logic.
 */

const serialize = (v) => JSON.stringify(v)

function flattenObject(obj, prefix = '', out = {}) {
  for (const [key, val] of Object.entries(obj)) {
    const k = prefix ? `${prefix}.${key}` : key
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      flattenObject(val, k, out)
    } else {
      out[k] = val
    }
  }
  return out
}

export function jsonToCsv(jsonStr, delimiter = ',', includeHeader = true, nestedMode = 'serialize') {
  if (!jsonStr || !jsonStr.trim()) return ''
  let data
  try {
    data = JSON.parse(jsonStr)
  } catch (e) {
    const pos = e.message.match(/position\s+(\d+)/)
    const line = pos ? (jsonStr.substring(0, parseInt(pos[1])).split('\n').length) : null
    const hint = line ? `（第 ${line} 行附近）` : ''
    throw new Error(`JSON 解析失败${hint}：${e.message}`)
  }
  if (!Array.isArray(data)) {
    throw new Error('JSON 必须是数组格式，例如 [{"a":1}, {"a":2}]')
  }
  if (data.length === 0) {
    return includeHeader ? '\n' : ''
  }

  // Normalize rows based on nested mode
  let rows = data.map(row => {
    if (row === null || typeof row !== 'object') {
      return { value: row } // non-object element → single column
    }
    if (nestedMode === 'flatten') return flattenObject(row)
    if (nestedMode === 'ignore') {
      const out = {}
      for (const [k, v] of Object.entries(row)) {
        if (v === null || typeof v !== 'object') out[k] = v
      }
      return out
    }
    return row // serialize (default)
  })

  const keys = [...new Set(rows.flatMap(obj => Object.keys(obj)))]
  const sep = delimiter
  let csv = ''

  if (includeHeader) {
    csv += keys.map(k => `"${String(k).replace(/"/g, '""')}"`).join(sep) + '\n'
  }

  for (const row of rows) {
    const vals = keys.map(k => {
      const v = row[k]
      if (v === null || v === undefined) return ''
      if (typeof v === 'object') return `"${serialize(v).replace(/"/g, '""')}"`
      return `"${String(v).replace(/"/g, '""')}"`
    })
    csv += vals.join(sep) + '\n'
  }

  return csv.trim()
}

/**
 * Parse a full CSV string into rows of fields, supporting quoted fields
 * containing newlines (RFC 4180).
 */
export function parseCsv(csvStr, delimiter = ',') {
  const rows = []
  let row = []
  let current = ''
  let inQuotes = false
  const s = csvStr

  const pushField = () => {
    row.push(current)
    current = ''
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < s.length; i++) {
    const char = s[i]
    if (inQuotes) {
      if (char === '"') {
        if (s[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === delimiter) {
        pushField()
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && s[i + 1] === '\n') i++
        if (current.trim() === '' && row.length === 0) {
          // skip blank line
          row = []
        } else {
          pushRow()
        }
      } else {
        current += char
      }
    }
  }
  if (current !== '' || row.length > 0) pushRow()
  return rows
}

export function csvToJson(csvStr, delimiter = ',', includeHeader = true) {
  if (!csvStr || !csvStr.trim()) return '[]'
  const rows = parseCsv(csvStr, delimiter)
  if (!rows.length) return '[]'

  const headers = rows[0].map(h => h.trim())
  const data = []
  const start = includeHeader ? 1 : 0
  const defaultHeaders = headers.map((_, i) => `col${i}`)
  const h = includeHeader ? headers : defaultHeaders

  for (let i = start; i < rows.length; i++) {
    const vals = rows[i]
    if (vals.length === 1 && vals[0].trim() === '') continue
    const obj = {}
    h.forEach((key, idx) => {
      obj[key] = vals[idx] !== undefined ? vals[idx].trim() : ''
    })
    data.push(obj)
  }

  return JSON.stringify(data, null, 2)
}

/** Count columns in each CSV row; returns first inconsistent row index or -1. */
export function findColumnMismatch(csvStr, delimiter = ',') {
  const rows = parseCsv(csvStr, delimiter)
  if (rows.length < 2) return -1
  const cols = rows[0].length
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length !== cols) return i + 1
  }
  return -1
}
