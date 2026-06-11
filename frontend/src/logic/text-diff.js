/**
 * Text difference logic.
 */

function escapeHtml(t) {
  return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function normalize(s, ignoreSpace = false) {
  return ignoreSpace ? (s || '').replace(/\s+/g, ' ').trim() : (s || '')
}

export function diffLines(oldStr, newStr, ignoreSpace = false) {
  const oldLines = (oldStr || '').split('\n')
  const newLines = (newStr || '').split('\n')
  const result = []
  let i = 0, j = 0
  while (i < oldLines.length || j < newLines.length) {
    const o = normalize(oldLines[i] || '', ignoreSpace)
    const n = normalize(newLines[j] || '', ignoreSpace)
    if (i >= oldLines.length) {
      result.push({ type: 'add', text: newLines[j] })
      j++
    } else if (j >= newLines.length) {
      result.push({ type: 'del', text: oldLines[i] })
      i++
    } else if (o === n) {
      result.push({ type: 'same', text: oldLines[i] })
      i++; j++
    } else {
      result.push({ type: 'del', text: oldLines[i] })
      result.push({ type: 'add', text: newLines[j] })
      i++; j++
    }
  }
  return result
}

function charDiffHtml(oldText, newText) {
  const maxLen = Math.max(oldText.length, newText.length)
  let oldHtml = ''
  let newHtml = ''
  for (let i = 0; i < maxLen; i++) {
    const oc = oldText[i] || ''
    const nc = newText[i] || ''
    if (oc === nc) {
      oldHtml += escapeHtml(oc)
      newHtml += escapeHtml(nc)
    } else {
      oldHtml += `<span style="background:rgba(239,68,68,0.3);text-decoration:line-through">${escapeHtml(oc || ' ')}</span>`
      newHtml += `<span style="background:rgba(34,197,94,0.3)">${escapeHtml(nc || ' ')}</span>`
    }
  }
  return { oldHtml, newHtml }
}

export function diffChars(oldStr, newStr, ignoreSpace = false) {
  const lines = diffLines(oldStr, newStr, ignoreSpace)
  const result = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.type === 'del' && i + 1 < lines.length && lines[i + 1].type === 'add') {
      const oldText = line.text
      const newText = lines[i + 1].text
      const { oldHtml, newHtml } = charDiffHtml(oldText, newText)
      result.push({ type: 'del', text: oldText, html: oldHtml })
      result.push({ type: 'add', text: newText, html: newHtml })
      i++
    } else {
      result.push(line)
    }
  }
  return result
}
