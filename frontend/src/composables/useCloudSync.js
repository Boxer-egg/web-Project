import { ref } from 'vue'
import { useStorage } from '@vueuse/core'

const CODE_STORAGE_KEY = 'cloud-sync-code'
const API_BASE = '/api/sync-data'

function generateCode() {
  const hex = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
  return `drv-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12)}`
}

function sanitizeForDisplay(code) {
  return code || '—'
}

export function useCloudSync() {
  const code = useStorage(CODE_STORAGE_KEY, '')
  const syncing = ref(false)
  const syncError = ref('')
  const lastSync = ref('')
  const lastPull = ref('')

  async function push(data) {
    if (!code.value) {
      code.value = generateCode()
    }
    syncing.value = true
    syncError.value = ''
    try {
      const res = await fetch(API_BASE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.value,
          data: {
            driving: data,
            savedAt: new Date().toISOString(),
          },
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || '同步失败')
      lastSync.value = new Date().toLocaleString()
    } catch (e) {
      syncError.value = '上传失败: ' + e.message
    } finally {
      syncing.value = false
    }
  }

  async function pull() {
    if (!code.value) {
      syncError.value = '暂无恢复码，请先生成'
      return null
    }
    syncing.value = true
    syncError.value = ''
    try {
      const res = await fetch(`${API_BASE}?code=${encodeURIComponent(code.value)}`)
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || '拉取失败')
      if (!json.exists) {
        syncError.value = '云端暂无数据'
        return null
      }
      lastPull.value = json.data.savedAt
        ? new Date(json.data.savedAt).toLocaleString()
        : new Date().toLocaleString()
      return json.data.driving || null
    } catch (e) {
      syncError.value = '拉取失败: ' + e.message
      return null
    } finally {
      syncing.value = false
    }
  }

  async function remove() {
    if (!code.value) return
    syncing.value = true
    try {
      await fetch(API_BASE, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.value }),
      })
    } finally {
      syncing.value = false
    }
  }

  function resetCode() {
    code.value = generateCode()
    syncError.value = ''
    lastSync.value = ''
    lastPull.value = ''
  }

  return {
    code,
    displayCode: sanitizeForDisplay(code.value),
    syncing,
    syncError,
    lastSync,
    lastPull,
    push,
    pull,
    remove,
    resetCode,
    generateCode,
  }
}
