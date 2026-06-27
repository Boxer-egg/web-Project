/**
 * Minify CSS string.
 * @param {string} css
 * @param {Object} [options]
 * @param {boolean} [options.minifyColor=false]
 * @param {boolean} [options.minifyZero=false]
 * @param {boolean} [options.mergeDuplicates=false]
 * @param {boolean} [options.removeEmpty=false]
 * @param {boolean} [options.removeQuotes=false]
 * @returns {{css: string, originalLength: number, minifiedLength: number, savedPercent: string}}
 */
export function minifyCss(css, options = {}) {
  if (typeof css !== 'string') {
    throw new TypeError('css must be a string')
  }
  const originalLength = css.length
  let out = css

  // Remove comments
  out = out.replace(/\/\*[\s\S]*?\*\//g, '')

  // Minify colors
  if (options.minifyColor) {
    out = out.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3(?![0-9a-fA-F])/g, '#$1$2$3')
  }

  // Minify zero values
  if (options.minifyZero) {
    out = out.replace(/(:\s*)0(?:px|em|rem|ex|ch|vh|vw|vmin|vmax|%|cm|mm|in|pt|pc)/gi, '$10')
  }

  // Remove empty rules
  if (options.removeEmpty) {
    out = out.replace(/[^{}]+\{\s*\}/g, '')
  }

  // Remove quotes from url()
  if (options.removeQuotes) {
    out = out.replace(/url\(["']([^"']+)["']\)/gi, 'url($1)')
  }

  // Collapse whitespace
  out = out.replace(/\s+/g, ' ')
  out = out.replace(/\s*([{}:;,])\s*/g, '$1')
  out = out.replace(/;\}/g, '}')
  out = out.trim()

  const minifiedLength = out.length
  const saved = originalLength === 0 ? 0 : ((originalLength - minifiedLength) / originalLength * 100)

  return {
    css: out,
    originalLength,
    minifiedLength,
    savedPercent: saved.toFixed(1) + '%'
  }
}
