/**
 * Word counting logic.
 */

export function countStats(text) {
  const str = text || ''
  const chinese = (str.match(/[一-龥]/g) || []).length
  const englishWords = (str.match(/\b[a-zA-Z]+\b/g) || []).length
  const charsNoSpace = str.replace(/\s/g, '').length
  const charsWithSpace = str.length
  const paragraphs = str === '' ? 0 : str.split(/\n\s*\n/).filter(p => p.trim()).length
  const lines = str === '' ? 0 : str.split('\n').length
  const readingTime = Math.max(1, Math.ceil(chinese / 300 + englishWords / 200))
  
  return { 
    chinese, 
    englishWords, 
    charsNoSpace, 
    charsWithSpace, 
    paragraphs, 
    lines, 
    readingTime 
  }
}
