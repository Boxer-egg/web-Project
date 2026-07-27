/**
 * Shared URL param parsing — replaces inline getUrlParams() across all tools.
 * Each tool component just needs: import { getUrlParams, applyParams } from '@/utils/urlParams'
 */

import { watch } from 'vue'

export function getUrlParams() {
  return new URLSearchParams(window.location.search)
}

/**
 * Apply URL params to a Vue reactive object using a mapping config.
 * Example:
 *   applyParams(params, {
 *     text: { ref: input, default: '' },
 *     action: { ref: mode, allowed: ['encode_named', 'encode_numeric', 'encode_hex', 'decode'] },
 *     auto: { ref: autoMode, transform: v => v === '1' },
 *   })
 */
export function applyParams(params, mapping) {
  let changed = false
  for (const [key, config] of Object.entries(mapping)) {
    const raw = params.get(key)
    if (raw === null || raw === undefined) continue
    if (config.allowed && !config.allowed.includes(raw)) continue
    const value = config.transform ? config.transform(raw) : raw
    if (value !== undefined && value !== null) {
      config.ref.value = value
      changed = true
    }
  }
  return changed
}

/** 常用 transform：把 query 字符串安全转成 number，非法值返回 undefined 跳过 */
export function toNumber(raw) {
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

/**
 * 判断当前值是否等于默认值（等于默认值的字段不写进 URL，保持链接短）。
 * 数字与数字字符串视为相等（如 0 与 '0'）。
 */
function isDefaultValue(value, def) {
  if (typeof def === 'number') return Number(value) === def
  return value === def
}

/** 把字段值序列化为 query 字符串 */
function toQueryValue(value) {
  if (typeof value === 'number') return String(value)
  return String(value ?? '')
}

/**
 * 基于映射表构建当前 URL 的 query 部分（仅包含非默认值字段）。
 * @param {Record<string, { ref: { value: any }, default: any }>} mapping
 * @returns {URLSearchParams}
 */
export function buildShareParams(mapping) {
  const params = new URLSearchParams()
  for (const [key, config] of Object.entries(mapping)) {
    const value = config.ref.value
    if (isDefaultValue(value, config.default)) continue
    params.set(key, toQueryValue(value))
  }
  return params
}

/**
 * 生成包含当前所有非默认参数值的完整分享链接。
 * @param {Record<string, { ref: { value: any }, default: any }>} mapping
 * @returns {string}
 */
export function buildShareUrl(mapping) {
  const params = buildShareParams(mapping)
  const base = `${window.location.origin}${window.location.pathname}`
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

/**
 * 监听映射表中的所有 ref，把非默认值同步到地址栏（replaceState，不产生历史记录）。
 * 带防抖，输入过程中不会高频改写 URL。
 *
 * @param {Record<string, { ref: import('vue').Ref, default: any }>} mapping
 * @param {{ debounceMs?: number }} [options]
 * @returns {() => void} 停止同步的函数（组件卸载时调用）
 */
export function syncParamsToUrl(mapping, { debounceMs = 300 } = {}) {
  let timer = null
  const stop = watch(
    () => Object.fromEntries(
      Object.entries(mapping).map(([key, config]) => [key, config.ref.value])
    ),
    () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        const params = buildShareParams(mapping)
        const qs = params.toString()
        const newUrl = qs
          ? `${window.location.pathname}?${qs}`
          : window.location.pathname
        window.history.replaceState(null, '', newUrl)
      }, debounceMs)
    },
    { deep: true }
  )
  return () => {
    if (timer) clearTimeout(timer)
    stop()
  }
}
