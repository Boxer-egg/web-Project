/**
 * Text processing logic for TextToolbox.
 */

export function toUpper(str) { return (str || '').toUpperCase() }
export function toLower(str) { return (str || '').toLowerCase() }
export function toCapitalize(str) {
  return (str || '').replace(/\b\w/g, c => c.toUpperCase())
}
export function swapCase(str) {
  return (str || '').replace(/[a-zA-Z]/g, c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())
}
export function removeDuplicateLines(str) {
  const lines = (str || '').split('\n')
  const seen = new Set()
  return lines.filter(line => {
    if (seen.has(line)) return false
    seen.add(line)
    return true
  }).join('\n')
}
export function removeEmptyLines(str) {
  return (str || '').split('\n').filter(line => line.trim() !== '').join('\n')
}
export function trimLines(str) {
  return (str || '').split('\n').map(line => line.trim()).join('\n')
}
export function mergeEmptyLines(str) {
  return (str || '').replace(/\n{2,}/g, '\n')
}
export function sortAsc(str) {
  return (str || '').split('\n').sort((a, b) => a.localeCompare(b)).join('\n')
}
export function sortDesc(str) {
  return (str || '').split('\n').sort((a, b) => b.localeCompare(a)).join('\n')
}
export function reverseLines(str) {
  return (str || '').split('\n').reverse().join('\n')
}
export function reverseChars(str) {
  return (str || '').split('').reverse().join('')
}
export function findReplace(str, find, replace, isRegex = false) {
  if (!find) return str
  try {
    if (isRegex) {
      const re = new RegExp(find, 'g')
      return (str || '').replace(re, replace)
    } else {
      return (str || '').split(find).join(replace)
    }
  } catch (e) {
    throw new Error('替换失败: ' + e.message)
  }
}
export function addLineNumbers(str) {
  return (str || '').split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
}
export function removeLineNumbers(str) {
  return (str || '').split('\n').map(line => line.replace(/^\s*\d+\.\s*/, '')).join('\n')
}
export function toList(str) {
  return (str || '').split('\n').filter(l => l.trim()).map(line => `- ${line.trim()}`).join('\n')
}

export function getStats(text) {
  const chars = (text || '').length
  const bytes = new Blob([text || '']).size
  const lines = (text === '' || !text) ? 0 : text.split('\n').length
  const words = (text || '').trim() === '' ? 0 : text.trim().split(/\s+/).length
  return { chars, bytes, lines, words }
}
