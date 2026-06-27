const SHAPE_TEMPLATES = {
  rect: '<rect x="10" y="10" width="100" height="80" fill="#3B82F6" />',
  circle: '<circle cx="60" cy="60" r="50" fill="#3B82F6" />',
  line: '<line x1="10" y1="10" x2="100" y2="100" stroke="#3B82F6" stroke-width="2" />',
  text: '<text x="10" y="50" font-size="24" fill="#333">Text</text>',
  path: '<path d="M10 10 L100 10 L100 100 Z" fill="#3B82F6" />'
}

/**
 * Get available SVG shape templates.
 * @returns {{[key:string]: string}}
 */
export function getShapeTemplates() {
  return SHAPE_TEMPLATES
}

/**
 * Pretty-print SVG string.
 * @param {string} svg
 * @returns {string}
 */
export function formatSvg(svg) {
  if (typeof svg !== 'string') throw new TypeError('svg must be a string')
  if (!svg.trim()) return ''

  // Simple token-based formatter: works in both browser and Node.
  const tokens = svg
    .replace(/\s+/g, ' ')
    .replace(/\s*>\s*/g, '>\n')
    .replace(/\s*<\s*/g, '\n<')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)

  let depth = 0
  const out = []

  for (const token of tokens) {
    const isClose = token.startsWith('</')
    const isSelfClose = token.endsWith('/>')
    const isOpen = token.startsWith('<') && !isClose && !token.startsWith('<!')
    const isComment = token.startsWith('<!--')

    if (isClose) depth = Math.max(0, depth - 1)
    out.push('  '.repeat(depth) + token)
    if (isOpen && !isSelfClose && !isComment) depth++
  }

  return out.join('\n')
}

/**
 * Minify SVG string.
 * @param {string} svg
 * @returns {string}
 */
export function minifySvg(svg) {
  if (typeof svg !== 'string') throw new TypeError('svg must be a string')
  return svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*\/\s*>/g, '/>')
    .trim()
}

/**
 * Insert a shape template into SVG code at cursor position.
 * @param {string} code
 * @param {string} shape
 * @param {number} cursorPos
 * @returns {string}
 */
export function insertShape(code, shape, cursorPos) {
  if (typeof code !== 'string') throw new TypeError('code must be a string')
  if (typeof cursorPos !== 'number') throw new TypeError('cursorPos must be a number')
  const template = SHAPE_TEMPLATES[shape]
  if (!template) return code
  const pos = Math.max(0, Math.min(cursorPos, code.length))
  const before = code.slice(0, pos)
  const after = code.slice(pos)
  const indent = '  '
  return before + '\n' + indent + template + '\n' + after
}
