/**
 * Timestamp logic for conversion.
 */

export function toDate(str) {
  if (!str) return null
  const trimmed = str.trim()
  if (!/^\d+$/.test(trimmed)) throw new Error('请输入纯数字')
  // 校验位数：仅支持 10 位（秒）或 13 位（毫秒）
  if (trimmed.length !== 10 && trimmed.length !== 13) {
    throw new Error('请输入 10 位（秒）或 13 位（毫秒）时间戳')
  }
  const num = parseInt(trimmed, 10)
  if (isNaN(num)) throw new Error('请输入有效的数字')
  
  // Auto-detect seconds vs milliseconds
  const ms = trimmed.length === 10 ? num * 1000 : num
  const d = new Date(ms)
  
  if (isNaN(d.getTime())) throw new Error('无效的时间戳')
  
  return {
    iso: d.toISOString(),
    local: formatLocalDate(d),
    friendly: friendlyFormat(d),
    unixSeconds: Math.floor(d.getTime() / 1000),
    unixMs: d.getTime(),
    relative: relativeTime(d),
  }
}

export function fromDate(str) {
  if (!str) return null
  const d = new Date(str.trim())
  if (isNaN(d.getTime())) throw new Error('无效的日期格式')
  
  return {
    unixSeconds: Math.floor(d.getTime() / 1000),
    unixMs: d.getTime(),
    iso: d.toISOString(),
    local: formatLocalDate(d),
    friendly: friendlyFormat(d),
  }
}

function friendlyFormat(d) {
  const pad = n => String(n).padStart(2, '0')
  const weeks = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 星期${weeks[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatLocalDate(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function relativeTime(d) {
  const diff = d.getTime() - Date.now()
  const abs = Math.abs(diff)
  const s = Math.floor(abs / 1000)
  if (s < 60) return diff > 0 ? `${s} 秒后` : `${s} 秒前`
  const m = Math.floor(s / 60)
  if (m < 60) return diff > 0 ? `${m} 分钟后` : `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return diff > 0 ? `${h} 小时后` : `${h} 小时前`
  const days = Math.floor(h / 24)
  return diff > 0 ? `${days} 天后` : `${days} 天前`
}
