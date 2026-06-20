import relationship from 'relationship.js'

const VALID_MODES = ['query', 'reverse', 'pair']
const VALID_REGIONS = ['default', 'northern', 'cantonese']

/** Mapping of friendly relation names used by the button panel. */
export const RELATION_BUTTONS = [
  { group: '长辈', items: [
    { label: '爸爸', value: '爸爸' },
    { label: '妈妈', value: '妈妈' },
    { label: '爷爷', value: '爷爷' },
    { label: '奶奶', value: '奶奶' },
    { label: '外公', value: '外公' },
    { label: '外婆', value: '外婆' },
    { label: '岳父', value: '岳父' },
    { label: '岳母', value: '岳母' },
    { label: '公公', value: '公公' },
    { label: '婆婆', value: '婆婆' },
  ]},
  { group: '配偶', items: [
    { label: '丈夫', value: '丈夫' },
    { label: '妻子', value: '妻子' },
  ]},
  { group: '平辈', items: [
    { label: '哥哥', value: '哥哥' },
    { label: '弟弟', value: '弟弟' },
    { label: '姐姐', value: '姐姐' },
    { label: '妹妹', value: '妹妹' },
    { label: '嫂子', value: '嫂子' },
    { label: '弟妹', value: '弟妹' },
    { label: '姐夫', value: '姐夫' },
    { label: '妹夫', value: '妹夫' },
  ]},
  { group: '晚辈', items: [
    { label: '儿子', value: '儿子' },
    { label: '女儿', value: '女儿' },
    { label: '侄子', value: '侄子' },
    { label: '侄女', value: '侄女' },
    { label: '外甥', value: '外甥' },
    { label: '外甥女', value: '外甥女' },
  ]}
]

export const REGION_OPTIONS = [
  { value: 'default', label: '默认' },
  { value: 'northern', label: '北方' },
  { value: 'cantonese', label: '广东' }
]

/**
 * Normalize a relationship chain by replacing commas with Chinese '的'.
 * @param {string} chain
 * @returns {string}
 */
export function normalizeChain(chain) {
  return String(chain || '')
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(Boolean)
    .join('的')
}

/**
 * Convert a normalized chain into a readable path prefixed with '我'.
 * @param {string} chain
 * @returns {string}
 */
export function chainToPath(chain) {
  const text = normalizeChain(chain)
  if (!text) return '我'
  return '我 → ' + text.replace(/的/g, ' → ')
}

/**
 * Build base options for relationship.js calls.
 * @param {number} sex
 * @param {string} mode
 * @returns {object}
 */
function baseOpts(sex, mode) {
  return {
    sex: Number(sex) === 0 ? 0 : 1,
    mode: VALID_REGIONS.includes(mode) ? mode : 'default'
  }
}

/**
 * Query the title for a relationship chain.
 * @param {string} chain - Relationship chain, e.g. '爸爸,妈妈,哥哥' or '爸爸的妈妈的哥哥'.
 * @param {number} sex - User sex: 0 female, 1 male.
 * @param {boolean} reverse - false = 我称呼对方, true = 对方称呼我.
 * @param {string} mode - Region mode.
 * @returns {object}
 */
export function queryTitle(chain, sex = 1, reverse = false, mode = 'default') {
  const text = normalizeChain(chain)
  if (!text) throw new Error('关系链不能为空')
  const titles = relationship({ text, reverse, ...baseOpts(sex, mode) })
  if (!titles || titles.length === 0) {
    throw new Error('无法识别该关系链，请检查称谓是否准确')
  }
  return {
    chain: text,
    path: chainToPath(text),
    titles,
    mode: 'query',
    sex,
    reverse,
    region: mode
  }
}

/**
 * Reverse lookup common relationship chains from a title.
 * @param {string} title - Kinship title, e.g. '舅公'.
 * @param {number} sex - User sex.
 * @param {string} mode - Region mode.
 * @returns {object}
 */
export function queryChain(title, sex = 1, mode = 'default') {
  const text = String(title || '').trim()
  if (!text) throw new Error('称谓不能为空')

  const opts = baseOpts(sex, mode)
  const titles = relationship({ text, reverse: true, ...opts })
  const chains = relationship({ text, type: 'chain', ...opts })
  const details = relationship({ text, reverse: true, type: 'chain', ...opts })

  if ((!titles || titles.length === 0) && (!chains || chains.length === 0)) {
    throw new Error('无法找到该称谓的反向关系链')
  }

  const results = []
  const count = Math.max(titles?.length || 0, chains?.length || 0, details?.length || 0)
  for (let i = 0; i < count; i++) {
    results.push({
      title: titles?.[i] || '',
      chain: chains?.[i] || '',
      detail: details?.[i] || ''
    })
  }

  return { title: text, results, mode: 'reverse', sex, region: mode }
}

/**
 * Query the relative title between two people.
 * @param {string} a - First person's relationship to me.
 * @param {string} b - Second person's relationship to me.
 * @param {number} sex - User sex.
 * @param {string} mode - Region mode.
 * @returns {object}
 */
export function queryPair(a, b, sex = 1, mode = 'default') {
  const textA = normalizeChain(a)
  const textB = normalizeChain(b)
  if (!textA || !textB) throw new Error('双方关系链不能为空')

  const opts = baseOpts(sex, mode)
  const result = relationship({ text: textA, target: textB, ...opts })
  if (!result || result.length === 0) {
    throw new Error('无法计算两者之间的称呼关系')
  }
  return {
    a: textA,
    b: textB,
    pathA: chainToPath(textA),
    pathB: chainToPath(textB),
    titles: result,
    mode: 'pair',
    sex,
    region: mode
  }
}

/**
 * Calculate relationship based on mode.
 * @param {string} input - Chain or title depending on mode.
 * @param {string} mode - 'query', 'reverse' or 'pair'.
 * @param {number} sex - User sex.
 * @param {boolean} reverse - For query mode only.
 * @param {string} region - Region mode.
 * @param {string} pairTarget - For pair mode only.
 * @returns {object}
 */
export function calculateRelationship(
  input,
  mode = 'query',
  sex = 1,
  reverse = false,
  region = 'default',
  pairTarget = ''
) {
  const m = (mode || 'query').toLowerCase()
  if (!VALID_MODES.includes(m)) throw new Error('mode 必须是 query、reverse 或 pair')
  const s = Number(sex) === 0 ? 0 : 1
  const r = String(region || 'default')

  switch (m) {
    case 'query':
      return queryTitle(input, s, reverse, r)
    case 'reverse':
      return queryChain(input, s, r)
    case 'pair':
      return queryPair(input, pairTarget, s, r)
    default:
      throw new Error('未知模式')
  }
}
