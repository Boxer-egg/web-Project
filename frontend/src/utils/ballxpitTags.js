/**
 * BALL x PIT 弹珠标签中英文映射
 */
export const TAG_LABELS = {
  'TAGS.DOT': '持续伤害',
  'TAGS.CC': '控制效果',
  'TAGS.AOE': '范围伤害',
  'TAGS.SUMMON': '召唤',
  'TAGS.LIFESTEAL': '吸血',
  'TAGS.PENETRATE': '穿透',
  'TAGS.DEBUFF': '减益',
  'TAGS.EXECUTE': '斩杀',
  'TAGS.MULTI_HIT': '多段攻击'
}

export function tagDisplayName(tag, lang = 'cn') {
  if (lang === 'en') return tag
  return TAG_LABELS[tag] || tag
}
