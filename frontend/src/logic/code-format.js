/**
 * Code formatting logic using js-beautify.
 */
import beautify from 'js-beautify'

export function format(code, lang, indentSize = 2) {
  if (!code || !code.trim()) return ''
  const opt = { 
    indent_size: indentSize,
    indent_with_tabs: indentSize === '\t',
    preserve_newlines: true,
    max_preserve_newlines: 2
  }

  switch (lang) {
    case 'javascript':
    case 'js':
    case 'json':
      return beautify.js_beautify(code, opt)
    case 'css':
      return beautify.css_beautify(code, opt)
    case 'html':
      return beautify.html_beautify(code, opt)
    default:
      return beautify.js_beautify(code, opt)
  }
}
