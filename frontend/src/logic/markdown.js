/**
 * Markdown logic using marked, highlight.js, and DOMPurify.
 */
import { marked } from 'marked'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

function highlightCode(code, lang) {
  try {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  } catch {
    return code
  }
}

export function render(markdown) {
  if (!markdown) return ''
  try {
    const renderer = new marked.Renderer()
    renderer.code = (code, lang) => {
      const highlighted = highlightCode(code, lang)
      return `<pre><code class="hljs language-${lang || 'plaintext'}">${highlighted}</code></pre>`
    }
    renderer.link = (href, title, text) => {
      const base = marked.Renderer.prototype.link.call(renderer, href, title, text)
      return base.replace(/<a /, '<a target="_blank" rel="noopener noreferrer" ')
    }
    const html = marked(markdown, { breaks: true, renderer })
    const sanitized = DOMPurify.sanitize(html)
    const doc = new DOMParser().parseFromString(sanitized, 'text/html')
    doc.querySelectorAll('a').forEach((a) => {
      if (!a.getAttribute('rel')) a.setAttribute('rel', 'noopener noreferrer')
      if (!a.getAttribute('target')) a.setAttribute('target', '_blank')
    })
    return doc.body.innerHTML
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
