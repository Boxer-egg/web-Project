/**
 * Regex testing logic.
 */

const MAX_MATCHES = 1000

export function testRegex(text, pattern, flags = 'g') {
  if (!text) return { matches: [], error: null }
  if (!pattern) return { matches: [], error: null }
  try {
    // 追加 'd' 标记以获取分组位置索引（不支持时退回普通模式）
    let re
    try {
      re = new RegExp(pattern, flags.includes('d') ? flags : flags + 'd')
    } catch {
      re = new RegExp(pattern, flags)
    }
    const matches = []
    let m
    let count = 0
    const startTime = Date.now()
    while ((m = re.exec(text)) !== null) {
      if (count++ > MAX_MATCHES) {
        return { matches, error: '匹配数量超过 1000，请简化表达式', truncated: true }
      }
      if (Date.now() - startTime > 1000) {
        return { matches, error: '正则匹配超时，请简化表达式', truncated: true }
      }
      // 按起始位置映射命名分组名，供分组表格/着色使用
      const nameByStart = {}
      const named = (m.indices && m.indices.groups) || {}
      for (const [name, range] of Object.entries(named)) {
        if (range) nameByStart[range[0]] = name
      }
      const groupNames = []
      const groupIndices = m.indices ? m.indices.slice(1) : null
      if (groupIndices) {
        groupIndices.forEach((g, i) => {
          if (!g) { groupNames.push(null); return }
          groupNames.push(nameByStart[g[0]] || null)
        })
      }
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
        groups: m.slice(1),
        groupIndices,
        groupNames
      })
      if (!re.global) break
      if (m[0].length === 0) re.lastIndex++
    }
    return { matches, error: null }
  } catch (e) {
    return { matches: [], error: e.message }
  }
}

export function replaceText(text, pattern, flags, replacement) {
  if (!text || !pattern) return { result: text || '', error: null }
  try {
    // 尊重用户选择的 flags：非全局（无 g）时仅替换第一处
    const re = new RegExp(pattern, flags)
    return { result: text.replace(re, replacement), error: null }
  } catch (e) {
    return { result: text || '', error: e.message }
  }
}

/** Extract capture group values for each match. */
export function extractGroups(text, pattern, flags = 'g') {
  const { matches } = testRegex(text, pattern, flags)
  const groups = []
  for (const match of matches) {
    if (match.groups.length) {
      match.groups.forEach((g, i) => groups.push({ index: i + 1, value: g === undefined ? '' : g }))
    }
  }
  return groups
}

export const PRESETS = [
  { name: '手机号', pattern: '1[3-9]\\d{9}', desc: '中国大陆手机号', flags: 'g' },
  { name: '邮箱', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+', desc: '电子邮箱', flags: 'g' },
  { name: 'URL', pattern: 'https?://[\\w\\-._~:/?#\\[\\]@!$&\'()*+,;=]+', desc: 'HTTP/HTTPS 链接', flags: 'g' },
  { name: 'IP 地址', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', desc: 'IPv4 地址', flags: 'g' },
  { name: '身份证号', pattern: '\\b\\d{17}[0-9Xx]\\b', desc: '18 位身份证', flags: 'g' },
  { name: '日期 YYYY-MM-DD', pattern: '\\d{4}-\\d{2}-\\d{2}', desc: '日期格式', flags: 'g' },
  { name: '时间 HH:MM', pattern: '\\b([01]\\d|2[0-3]):[0-5]\\d\\b', desc: '24 小时制时间', flags: 'g' },
  { name: '中文汉字', pattern: '[\\u4e00-\\u9fa5]+', desc: '连续中文字符', flags: 'g' },
  { name: '字母数字下划线', pattern: '\\w+', desc: '单词字符', flags: 'g' },
  { name: '空白行', pattern: '^\\s*$', desc: '空行/纯空白行', flags: 'gm' },
]
