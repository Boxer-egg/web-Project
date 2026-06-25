/**
 * Martian text converter: bidirectional mapping between common Chinese
 * characters and their "Martian" style variants.
 */

const MARTIAN_MAP = {
  '的': 'ㄖ',
  '我': '莪',
  '你': '伱',
  '他': '彵',
  '她': '祂',
  '它': '牠',
  '们': '們',
  '爱': '嗳',
  '喜欢': '囍歡',
  '是': '昰',
  '不': '卟',
  '了': '叻',
  '在': '洅',
  '有': '洧',
  '这': '這',
  '个': '箇',
  '上': '丄',
  '下': '丅',
  '人': '亾',
  '天': '兲',
  '地': '哋',
  '说': '説',
  '好': '恏',
  '看': 'kan',
  '见': '見',
  '心': '吢',
  '死': '歽',
  '生': '笙',
  '年': '姩',
  '月': '仴',
  '日': 'ㄖ',
  '时': '時',
  '分': '汾',
  '秒': '淼',
  '吗': '嗎',
  '呢': 'ㄋ',
  '吧': '紦',
  '啊': '锕',
  '哦': '莪',
  '嗯': '蒽',
  '很': '詪',
  '会': '會',
  '能': '螚',
  '就': '僦',
  '都': '嘟',
  '要': '婹',
  '想': '想',
  '去': '厾',
  '来': '來',
  '走': '赱',
  '回': '囬',
  '过': '濄',
  '到': '菿',
  '给': '給',
  '让': '讓',
  '被': '陂',
  '把': '紦',
  '又': '叒',
  '也': '乜',
  '而': '侕',
  '但': '柦',
  '因': '洇',
  '为': '為',
  '所': '所',
  '以': '苡',
  '和': '咊',
  '与': '與',
  '或': '彧',
  '如果': '茹裹',
  '因为': '洇为',
  '所以': '所苡',
  '但是': '柦昰',
  '只是': '只昰',
  '没有': '沒囿',
  '怎么': '怎庅',
  '什么': '什庅',
  '为什么': '为什庅',
  '可以': '岢苡',
  '不要': '卟崾',
  '知道': '知噵',
  '觉得': '觉嘚',
  '朋友': '萠叐',
  '世界': '丗堺'
}

// Build reverse map. Single characters take precedence over multi-character keys.
const REVERSE_MAP = {}
for (const [k, v] of Object.entries(MARTIAN_MAP)) {
  REVERSE_MAP[v] = k
}

/**
 * Convert normal text to Martian text.
 * @param {string} text
 * @returns {string}
 */
export function toMartian(text) {
  let result = String(text || '')
  // Replace longer phrases first to avoid partial overlap.
  const keys = Object.keys(MARTIAN_MAP).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    result = result.split(key).join(MARTIAN_MAP[key])
  }
  return result
}

/**
 * Convert Martian text back to normal text.
 * @param {string} text
 * @returns {string}
 */
export function toNormal(text) {
  let result = String(text || '')
  const keys = Object.keys(REVERSE_MAP).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    result = result.split(key).join(REVERSE_MAP[key])
  }
  return result
}

export const DIRECTIONS = [
  { value: 'toMartian', label: '普通文 → 火星文' },
  { value: 'toNormal', label: '火星文 → 普通文' }
]
