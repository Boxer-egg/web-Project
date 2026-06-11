/**
 * Markdown logic using marked and DOMPurify.
 */
import { marked } from 'marked'
import DOMPurify from 'dompurify'

export function render(markdown) {
  if (!markdown) return ''
  try {
    return DOMPurify.sanitize(marked(markdown, { breaks: true }))
  } catch (e) {
    throw new Error('渲染错误: ' + e.message)
  }
}

export function exportHtml(html) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Markdown Export</title>
<style>
body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6}
code{background:#f4f4f4;padding:2px 6px;border-radius:3px}
pre{background:#f4f4f4;padding:16px;border-radius:6px;overflow:auto}
blockquote{border-left:4px solid #ddd;padding-left:16px;color:#666;margin:0}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f4f4f4}
</style>
</head>
<body>
${html}
</body>
</html>`
}
