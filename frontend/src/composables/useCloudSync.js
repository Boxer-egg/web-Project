import { ref } from 'vue'
import { useStorage } from '@vueuse/core'

const CODE_STORAGE_KEY = 'cloud-sync-code'
const API_BASE = '/api/sync-data'
const HISTORY_LIMIT = 50

const code = useStorage(CODE_STORAGE_KEY, '')
const wrongIds = useStorage('driving-quiz-wrong-ids', [])
const quizHistory = useStorage('driving-quiz-history', [])
const syncing = ref(false)
const syncError = ref('')
const lastSync = ref('')
const lastPull = ref('')

function generateCode() {
  const hex = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
  return `drv-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12)}`
}

function mergeDrivingData(remote) {
  if (!remote) return
  const mergedWrong = new Set([...wrongIds.value, ...(remote.wrongIds || [])])
  wrongIds.value = Array.from(mergedWrong)
  const existing = new Set(quizHistory.value.map(h => h.date + h.mode))
  const mergedHistory = [
    ...quizHistory.value,
    ...(remote.quizHistory || []).filter(h => !existing.has(h.date + h.mode)),
  ]
  mergedHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
  quizHistory.value = mergedHistory.slice(0, HISTORY_LIMIT)
}

export function useCloudSync() {
  async function push() {
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
            driving: {
              wrongIds: wrongIds.value,
              quizHistory: quizHistory.value,
            },
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
      syncError.value = '请先输入恢复码'
      return false
    }
    syncing.value = true
    syncError.value = ''
    try {
      const res = await fetch(`${API_BASE}?code=${encodeURIComponent(code.value)}`)
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || '拉取失败')
      if (!json.exists) {
        syncError.value = '云端暂无数据'
        return false
      }
      lastPull.value = json.data.savedAt
        ? new Date(json.data.savedAt).toLocaleString()
        : new Date().toLocaleString()
      mergeDrivingData(json.data.driving)
      return true
    } catch (e) {
      syncError.value = '拉取失败: ' + e.message
      return false
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
    wrongIds,
    quizHistory,
    syncing,
    syncError,
    lastSync,
    lastPull,
    push,
    pull,
    remove,
    resetCode,
  }
}
