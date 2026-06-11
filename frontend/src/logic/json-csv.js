/**
 * JSON ↔ CSV logic.
 */

export function jsonToCsv(jsonStr, delimiter = ',', includeHeader = true) {
  if (!jsonStr || !jsonStr.trim()) return ''
  const data = JSON.parse(jsonStr)
  if (!Array.isArray(data)) {
    throw new Error('JSON 必须是数组格式，例如 [{"a":1}, {"a":2}]')
  }
  if (data.length === 0) return ''

  const keys = [...new Set(data.flatMap(obj => Object.keys(obj)))]
  const sep = delimiter
  let csv = ''

  if (includeHeader) {
    csv += keys.map(k => `"${String(k).replace(/"/g, '""')}"`).join(sep) + '\n'
  }

  for (const row of data) {
    const vals = keys.map(k => {
      const v = row[k]
      if (v === null || v === undefined) return ''
      if (typeof v === 'object') return `"${JSON.stringify(v).replace(/"/g, '""')}"`
      return `"${String(v).replace(/"/g, '""')}"`
    })
    csv += vals.join(sep) + '\n'
  }

  return csv.trim()
}

export function csvToJson(csvStr, delimiter = ',', includeHeader = true) {
  if (!csvStr || !csvStr.trim()) return '[]'
  const lines = csvStr.trim().split(/\r?\n/)
  if (lines.length === 0) return '[]'

  const sep = delimiter
  const parseLine = (line) => {
    const result = []
    let inQuotes = false
    let current = ''
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === sep && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0])
  const data = []
  const start = includeHeader ? 1 : 0
  const defaultHeaders = headers.map((_, i) => `col${i}`)

  for (let i = start; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const vals = parseLine(lines[i])
    const obj = {}
    const h = includeHeader ? headers : defaultHeaders
    h.forEach((key, idx) => {
      obj[key] = vals[idx] || ''
    })
    data.push(obj)
  }

  return JSON.stringify(data, null, 2)
}
