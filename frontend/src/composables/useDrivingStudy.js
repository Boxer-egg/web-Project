import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { fetchWithTimeout } from '../utils/fetchWithTimeout.js'

const STORAGE_KEY = 'driving-study-progress'

/**
 * 管理科目一学习数据与进度。
 * @returns {{
 *   data: import('vue').Ref<object>,
 *   loading: import('vue').Ref<boolean>,
 *   error: import('vue').Ref<string>,
 *   progress: import('vue').Ref<string[]>,
 *   chapters: import('vue').ComputedRef<Array>,
 *   allTopicIds: import('vue').ComputedRef<string[]>,
 *   completedCount: import('vue').ComputedRef<number>,
 *   totalCount: import('vue').ComputedRef<number>,
 *   loadData: () => Promise<void>,
 *   isCompleted: (topicId: string) => boolean,
 *   markCompleted: (topicId: string) => void,
 *   unmarkCompleted: (topicId: string) => void,
 *   findTopicById: (topicId: string) => { chapter: object, topic: object } | null,
 *   getTopicIndex: (topicId: string) => number,
 *   getNextTopicId: (topicId: string) => string | null,
 *   getPrevTopicId: (topicId: string) => string | null,
 *   getChapterForTopic: (topicId: string) => object | null
 * }}
 */
export function useDrivingStudy() {
  const data = ref({ meta: {}, chapters: [] })
  const loading = ref(false)
  const error = ref('')
  const progress = useStorage(STORAGE_KEY, [])

  const chapters = computed(() => {
    const list = data.value.chapters || []
    return [...list].sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  const allTopicIds = computed(() => {
    return chapters.value.flatMap(ch => (ch.topics || []).map(t => t.id))
  })

  const completedCount = computed(() => {
    const set = new Set(progress.value)
    return allTopicIds.value.filter(id => set.has(id)).length
  })

  const totalCount = computed(() => allTopicIds.value.length)

  async function loadData() {
    loading.value = true
    error.value = ''
    try {
      const res = await fetchWithTimeout('/data/driving-license-study.json', {}, 15000)
      if (!res.ok) throw new Error('学习资料加载失败')
      data.value = await res.json()
    } catch (e) {
      error.value = '学习资料加载失败：' + (e.message || '网络异常')
    } finally {
      loading.value = false
    }
  }

  function isCompleted(topicId) {
    return progress.value.includes(topicId)
  }

  function markCompleted(topicId) {
    if (!progress.value.includes(topicId)) {
      progress.value = [...progress.value, topicId]
    }
  }

  function unmarkCompleted(topicId) {
    progress.value = progress.value.filter(id => id !== topicId)
  }

  function findTopicById(topicId) {
    for (const ch of chapters.value) {
      const topic = (ch.topics || []).find(t => t.id === topicId)
      if (topic) return { chapter: ch, topic }
    }
    return null
  }

  function getTopicIndex(topicId) {
    return allTopicIds.value.indexOf(topicId)
  }

  function getNextTopicId(topicId) {
    const idx = getTopicIndex(topicId)
    return allTopicIds.value[idx + 1] || null
  }

  function getPrevTopicId(topicId) {
    const idx = getTopicIndex(topicId)
    return allTopicIds.value[idx - 1] || null
  }

  function getChapterForTopic(topicId) {
    const found = findTopicById(topicId)
    return found ? found.chapter : null
  }

  return {
    data,
    loading,
    error,
    progress,
    chapters,
    allTopicIds,
    completedCount,
    totalCount,
    loadData,
    isCompleted,
    markCompleted,
    unmarkCompleted,
    findTopicById,
    getTopicIndex,
    getNextTopicId,
    getPrevTopicId,
    getChapterForTopic,
  }
}
