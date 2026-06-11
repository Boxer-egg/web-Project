/**
 * Shared URL param parsing — replaces inline getUrlParams() across all tools.
 * Each tool component just needs: import { getUrlParams, applyParams } from '@/utils/urlParams'
 */

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
