/**
 * Martian text converter: bidirectional mapping between common Chinese
 * characters and their "Martian" style variants.
 *
 * The map covers high-frequency single characters and common phrases.
 * Longer keys are replaced first to avoid partial overlap.
 */

const MARTIAN_MAP = {
  // High-frequency function words
  '的': 'ㄖ',
  '了': '叻',
  '是': '昰',
  '在': '洅',
  '和': '咊',
  '与': '與',
  '或': '彧',

  // Pronouns
  '我': '莪',
  '你': '伱',
  '您': '尓',
  '他': '彵',
  '她': '祂',
  '它': '牠',
  '们': '們',
  '我们': '莪們',
  '你们': '伱們',
  '他们': '彵們',
  '她们': '祂們',
  '它们': '牠們',

  // Common verbs / adjectives
  '爱': '嗳',
  '喜欢': '囍歡',
  '不': '卟',
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
  '日': '曰',
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
  '想': '葙',
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
  '如': '茹',
  '果': '惈',
  '只': '咫',
  '没': '莈',
  '怎': '咋',
  '么': '庅',
  '什': '甚',
  '可': '岢',
  '知': '椥',
  '道': '噵',
  '觉': '覺',
  '得': '嘚',
  '朋': '萠',
  '友': '叐',
  '世': '丗',
  '界': '堺',
  '做': '莋',
  '作': '怍',
  '对': '対',
  '大': '汏',
  '小': '尐',
  '多': '哆',
  '少': '仯',
  '高': '滈',
  '低': '菧',
  '长': '萇',
  '快': '筷',
  '慢': '嫚',
  '新': '噺',
  '旧': '舊',
  '老': '佬',
  '男': '莮',
  '女': '钕',
  '子': '孓',
  '儿': '児',
  '王': '迋',
  '国': '囯',
  '家': '傢',
  '学': '學',
  '校': '恔',
  '文': '呅',
  '字': '牸',
  '书': '書',
  '画': '畵',
  '音': '喑',
  '乐': '樂',
  '飞': '飛',
  '跑': '趮',
  '吃': '喫',
  '喝': '嗬',
  '听': '聽',
  '问': '問',
  '答': '荅',
  '写': '冩',
  '读': '讀',
  '重': '偅',
  '轻': '輕',
  '热': '熱',
  '冷': '泠',
  '红': '葒',
  '绿': '綠',
  '蓝': '藍',
  '白': '苩',
  '黑': '嫼',
  '黄': '黃',
  '花': '埖',
  '草': '愺',
  '树': '樹',
  '林': '啉',
  '山': '屾',
  '川': '巛',
  '江': '茳',
  '河': '菏',
  '海': '嗨',
  '湖': '煳',
  '手': '掱',
  '足': '娖',
  '口': 'ロ',
  '耳': '洱',
  '东': '崬',
  '西': '覀',
  '南': '湳',
  '北': '丠',
  '中': 'ф',
  '春': '萅',
  '夏': '嗄',
  '秋': '偢',
  '冬': '咚',
  '早': '蚤',
  '明': '眀',
  '暗': '黯',
  '左': '咗',
  '右': '祐',
  '前': '偂',
  '后': '後',
  '里': '裡',
  '外': '迯',
  '开': '閞',
  '关': '関',
  '进': '琎',
  '出': '炪',

  // Numbers
  '一': '①',
  '二': '②',
  '三': '③',
  '四': '④',
  '五': '⑤',
  '六': '⑥',
  '七': '⑦',
  '八': '⑧',
  '九': '⑨',
  '十': '⑩',
  '百': '佰',
  '千': '仟',
  '万': '萬',

  // Common phrases
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
  '世界': '丗堺',
  '今天': '妗兲',
  '明天': '眀兲',
  '昨天': '莋兲',
  '现在': '哯茬',
  '一起': '壹起',
  '非常': '悱瑺',
  '真的': '嫃ㄖ',
  '快乐': '赽樂',
  '开心': '閞杺',
  '难过': '難過',
  '漂亮': '漂湸',
  '可爱': '岢嗳',
  '厉害': '劦嗐',
  '老师': '荖師',
  '学校': '學校',
  '家庭': '傢庭',
  '工作': '笁莋',
  '生活': '笙萿',
  '时间': '時簡',
  '中国': '狆國',
  '北京': '丠亰',
  '上海': '仩嗨',
  '广州': '廣詶',
  '深圳': '堔圳'
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
