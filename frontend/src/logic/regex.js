/**
 * Regex testing logic.
 */

export function testRegex(text, pattern, flags = 'g') {
  if (!text || !pattern) return { matches: [], error: null }
  try {
    const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
    const matches = []
    let m
    let count = 0
    while ((m = re.exec(text)) !== null) {
      if (count++ > 1000) break
      matches.push({ start: m.index, end: m.index + m[0].length, text: m[0], groups: m.slice(1) })
      if (!re.global) break
      if (m[0].length === 0) re.lastIndex++
    }
    return { matches, error: null }
  } catch (e) {
    return { matches: [], error: e.message }
  }
}
