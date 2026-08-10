/**
 * 从夯到拉排行榜逻辑
 */

/** 风格预设 */
export const STYLE_PRESETS = {
  default: { name: '纯色大字', bg: '#ffffff', cardBg: '#f3f4f6', cardBorder: '#e5e7eb', text: '#111827', font: 'bold 16px sans-serif' },
  neon: { name: '酸性霓虹', bg: '#0f172a', cardBg: '#1e293b', cardBorder: '#06b6d4', text: '#22d3ee', font: 'bold 16px sans-serif' },
  cute: { name: '糖果可爱', bg: '#fff1f2', cardBg: '#ffe4e6', cardBorder: '#fda4af', text: '#be123c', font: 'bold 16px "PingFang SC", sans-serif' },
  cyber: { name: '赛博暗黑', bg: '#020617', cardBg: '#111827', cardBorder: '#7c3aed', text: '#c4b5fd', font: 'bold 16px monospace' },
  cream: { name: '清新奶油', bg: '#fefce8', cardBg: '#fef9c3', cardBorder: '#fde047', text: '#713f12', font: 'bold 16px "PingFang SC", sans-serif' },
  pixel: { name: '像素游戏', bg: '#ecfdf5', cardBg: '#d1fae5', cardBorder: '#10b981', text: '#064e3b', font: 'bold 16px monospace' },
}

/** 配色预设（每个 tier 依次使用） */
export const COLOR_SCHEMES = {
  classic: { name: '经典热榜', colors: ['#ef4444', '#f97316', '#eab308', '#9ca3af', '#6b7280', '#1f2937'] },
  mint: { name: '清新薄荷', colors: ['#10b981', '#06b6d4', '#3b82f6', '#94a3b8', '#64748b', '#334155'] },
  morandi: { name: '莫兰迪', colors: ['#d9777f', '#8da399', '#7a9eb1', '#a3a3a3', '#8b7e7e', '#6b5b5b'] },
  sunset: { name: '日落暖调', colors: ['#dc2626', '#f97316', '#fbbf24', '#d97706', '#78350f', '#451a03'] },
  candy: { name: '糖果亮彩', colors: ['#ec4899', '#a855f7', '#3b82f6', '#22c55e', '#eab308', '#f97316'] },
  gold: { name: '黑金高定', colors: ['#ca8a04', '#a16207', '#854d0e', '#713f12', '#451a03', '#271c19'] },
}

/** 档位预设 */
export const TIER_PRESETS = {
  classic: { name: '经典夯拉', labels: ['夯', '顶级', '人上人', 'NPC', '拉', '拉完了'] },
  crazy: { name: '抽象发疯', labels: ['神', '仙', '巅', '寄', '摆', '史'] },
  cute: { name: '可爱软萌', labels: ['超爱', '喜欢', '还行', '一般', '不太行', '达咩'] },
  cyber: { name: '赛博强度', labels: ['S', 'A', 'B', 'C', 'D', 'F'] },
  city: { name: '城市研究版', labels: ['必去', '推荐', '可去', '一般', '避雷', '坑'] },
  minimal: { name: '极简五档', labels: ['优', '良', '中', '差', '烂'] },
}

/** 示例素材 */
export const SAMPLE_TEXTS = [
  '🍔 汉堡', '🍕 披萨', '🍣 寿司', '🍜 拉面', '🥗 沙拉', '🍰 蛋糕', '🍟 薯条', '🍦 冰淇淋',
]

/** 生成唯一 ID */
export function uid(prefix = 'i') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** 将文件转为 Data URL */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

/** 从剪贴板或拖拽事件读取文件 */
export function getFilesFromEvent(e) {
  if (!e) return []
  if (e.dataTransfer?.files?.length) return Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
  if (e.clipboardData?.files?.length) return Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'))
  return []
}

/** 从剪贴板读取文本 */
export function getTextFromEvent(e) {
  if (!e || !e.clipboardData) return ''
  return e.clipboardData.getData('text') || e.clipboardData.getData('text/plain') || ''
}

/** 将文本按行拆分为卡片数组 */
export function textsToItems(texts) {
  return texts
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map(content => ({ id: uid(), content, type: 'text', tierId: null }))
}

/** 应用档位预设 */
export function applyTierPreset(state, presetKey) {
  const preset = TIER_PRESETS[presetKey]
  if (!preset) return
  const current = state.tiers.slice()
  const next = []
  for (let i = 0; i < preset.labels.length; i++) {
    const color = current[i]?.color || (state.colorScheme ? COLOR_SCHEMES[state.colorScheme]?.colors[i] : null) || '#6b7280'
    next.push({ id: current[i]?.id || uid('tier'), label: preset.labels[i], color })
  }
  // 保留原 tierId 映射：如果旧 tier 被移除，把对应物品变为未排序
  const oldIds = new Set(current.map(t => t.id))
  const keptIds = new Set(next.map(t => t.id))
  for (const item of state.items) {
    if (item.tierId && oldIds.has(item.tierId) && !keptIds.has(item.tierId)) {
      item.tierId = null
    }
  }
  state.tiers = next
}

/** 应用配色预设 */
export function applyColorScheme(state, schemeKey) {
  const scheme = COLOR_SCHEMES[schemeKey]
  if (!scheme) return
  state.tiers = state.tiers.map((t, i) => ({ ...t, color: scheme.colors[i % scheme.colors.length] }))
}

/** 应用风格预设 */
export function applyStylePreset(state, styleKey) {
  state.style = styleKey
}

/** 把排行榜数据渲染到 canvas，返回 canvas 元素 */
export async function renderRankCanvas(state, options = {}) {
  const {
    cardSize = 92,
    labelSize = 34,
    width = 960,
    scale = 2,
    onProgress,
  } = options

  const style = STYLE_PRESETS[state.style] || STYLE_PRESETS.default
  const tiers = state.tiers
  const rowGap = 14
  const padding = 24
  const labelWidth = Math.max(80, labelSize * 1.8)
  const cardGap = 10
  const cardsPerRow = Math.max(1, Math.floor((width - padding * 2 - labelWidth - cardGap) / (cardSize + cardGap)))

  // 计算每个 tier 占几行
  const rows = tiers.map(tier => {
    const items = state.items.filter(i => i.tierId === tier.id)
    const rowsNeeded = Math.max(1, Math.ceil(items.length / cardsPerRow))
    return { tier, items, rowsNeeded }
  })

  const headerHeight = 90
  const rowBaseHeight = cardSize + 16
  const contentHeight = rows.reduce((sum, r) => sum + r.rowsNeeded * rowBaseHeight + rowGap, 0) + rowGap * 2 + 40
  const footerHeight = 40
  const height = headerHeight + contentHeight + footerHeight

  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 canvas')
  ctx.scale(scale, scale)

  // 背景
  ctx.fillStyle = style.bg
  ctx.fillRect(0, 0, width, height)

  // 标题
  ctx.fillStyle = style.text
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = 'bold 32px "PingFang SC", sans-serif'
  ctx.fillText(state.title || '从夯到拉排行榜', padding, 48)
  if (state.subtitle) {
    ctx.font = '16px "PingFang SC", sans-serif'
    ctx.fillStyle = adjustAlpha(style.text, 0.7)
    ctx.fillText(state.subtitle, padding, 74)
  }

  let y = headerHeight
  for (let idx = 0; idx < rows.length; idx++) {
    const { tier, items, rowsNeeded } = rows[idx]
    const rowHeight = rowsNeeded * rowBaseHeight

    // 左侧标签背景
    ctx.fillStyle = tier.color
    const radius = 8
    roundRect(ctx, padding, y, labelWidth, rowHeight, radius, true, false)

    // 标签文字
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${labelSize}px "PingFang SC", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(tier.label, padding + labelWidth / 2, y + rowHeight / 2)

    // 右侧卡片区背景
    ctx.fillStyle = style.cardBg
    ctx.strokeStyle = style.cardBorder
    ctx.lineWidth = 1
    roundRect(ctx, padding + labelWidth + cardGap, y, width - padding * 2 - labelWidth - cardGap, rowHeight, radius, true, true)

    // 绘制卡片
    const contentX = padding + labelWidth + cardGap * 2
    const contentY = y + 8
    let col = 0
    let row = 0
    for (const item of items) {
      const cx = contentX + col * (cardSize + cardGap)
      const cy = contentY + row * (cardSize + cardGap)
      await drawCard(ctx, item, cx, cy, cardSize, style, onProgress)
      col++
      if (col >= cardsPerRow) {
        col = 0
        row++
      }
    }

    y += rowHeight + rowGap
  }

  // 未排序物品单独绘制
  const unranked = state.items.filter(i => !i.tierId)
  if (unranked.length > 0) {
    ctx.fillStyle = adjustAlpha(style.text, 0.5)
    ctx.font = '14px "PingFang SC", sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('未排序：', padding, y + 20)
    y += 28
    let col = 0
    const maxCols = Math.floor((width - padding * 2) / (cardSize + cardGap))
    for (const item of unranked) {
      const cx = padding + col * (cardSize + cardGap)
      await drawCard(ctx, item, cx, y, cardSize, style, onProgress)
      col++
      if (col >= maxCols) {
        col = 0
        y += cardSize + cardGap
      }
    }
    y += cardSize + cardGap
  }

  // 底部水印
  ctx.fillStyle = adjustAlpha(style.text, 0.3)
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText('vvzzv.com · 从夯到拉排行榜', width - padding, height - 12)

  return canvas
}

function adjustAlpha(color, alpha) {
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return color
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
  if (fill) ctx.fill()
  if (stroke) ctx.stroke()
}

async function drawCard(ctx, item, x, y, size, style, onProgress) {
  const radius = 8
  ctx.fillStyle = style.cardBg
  ctx.strokeStyle = style.cardBorder
  ctx.lineWidth = 1
  roundRect(ctx, x, y, size, size, radius, true, true)

  if (item.type === 'image') {
    try {
      const img = new Image()
      img.src = item.content
      await new Promise((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('图片加载失败'))
        setTimeout(() => reject(new Error('图片加载超时')), 5000)
      })
      const ratio = Math.min((size - 8) / img.width, (size - 8) / img.height)
      const dw = img.width * ratio
      const dh = img.height * ratio
      const dx = x + (size - dw) / 2
      const dy = y + (size - dh) / 2
      ctx.drawImage(img, dx, dy, dw, dh)
    } catch {
      ctx.fillStyle = style.text
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('图片', x + size / 2, y + size / 2)
    }
  } else {
    ctx.fillStyle = style.text
    const font = style.font || 'bold 16px sans-serif'
    ctx.font = font.replace(/\d+px/, '14px').replace(/bold\s+/i, 'bold ')
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const maxChars = 14
    const text = item.content.length > maxChars ? item.content.slice(0, maxChars - 1) + '…' : item.content
    ctx.fillText(text, x + size / 2, y + size / 2)
  }

  if (onProgress) onProgress()
}

/** 导出 canvas 为 PNG 并下载 */
export function downloadCanvas(canvas, filename = 'hang-la-rank.png') {
  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = filename
  link.click()
}

/** 复制 canvas 到剪贴板 */
export async function copyCanvas(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error('无法生成图片'))
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        resolve()
      } catch (e) {
        reject(e)
      }
    }, 'image/png')
  })
}

/** 导出 JSON */
export function exportRankJson(state) {
  const data = JSON.stringify(state, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hang-la-rank-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** 导入 JSON */
export async function importRankJson(file) {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!data.tiers || !Array.isArray(data.items)) throw new Error('格式不正确')
  return data
}

/** 分享数据编码/解码 */
export function encodeRankState(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))))
}

export function decodeRankState(encoded) {
  return JSON.parse(decodeURIComponent(escape(atob(encoded))))
}
