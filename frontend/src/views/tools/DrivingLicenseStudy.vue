<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDrivingStudy } from '../../composables/useDrivingStudy.js'

const route = useRoute()
const router = useRouter()

const {
  data,
  loading,
  error,
  chapters,
  completedCount,
  totalCount,
  loadData,
  isCompleted,
  markCompleted,
  findTopicById,
  getNextTopicId,
  getPrevTopicId,
  getChapterForTopic,
} = useDrivingStudy()

/** 当前视图：overview | topic | finish */
const view = ref('overview')
/** 当前知识点 ID */
const currentTopicId = ref('')

const progressPercent = computed(() => {
  if (!totalCount.value) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const currentTopic = computed(() => {
  const found = findTopicById(currentTopicId.value)
  return found ? found.topic : null
})

const currentChapter = computed(() => {
  return getChapterForTopic(currentTopicId.value)
})

const topicIndex = computed(() => {
  return Math.max(0, chapters.value.flatMap(ch => ch.topics || []).findIndex(t => t.id === currentTopicId.value) + 1)
})

const hasNext = computed(() => !!getNextTopicId(currentTopicId.value))
const hasPrev = computed(() => !!getPrevTopicId(currentTopicId.value))

function startStudy(topicId) {
  currentTopicId.value = topicId || chapters.value[0]?.topics?.[0]?.id || ''
  view.value = 'topic'
}

function continueStudy() {
  const firstIncomplete = chapters.value
    .flatMap(ch => ch.topics || [])
    .find(t => !isCompleted(t.id))
  startStudy(firstIncomplete?.id)
}

function goToTopic(topicId) {
  currentTopicId.value = topicId
  view.value = 'topic'
}

function nextTopic() {
  const next = getNextTopicId(currentTopicId.value)
  if (next) {
    currentTopicId.value = next
  } else {
    view.value = 'finish'
  }
}

function prevTopic() {
  const prev = getPrevTopicId(currentTopicId.value)
  if (prev) currentTopicId.value = prev
}

function completeAndNext() {
  markCompleted(currentTopicId.value)
  nextTopic()
}

function goToQuiz() {
  const chapter = currentChapter.value
  const quizChapter = currentTopic.value?.quizChapter || chapter?.title
  if (quizChapter) {
    router.push(`/driving/quiz?mode=sequential&chapter=${encodeURIComponent(quizChapter)}`)
  }
}

function goHome() {
  view.value = 'overview'
}

onMounted(loadData)

watch(currentTopicId, (id) => {
  if (id && view.value === 'topic') {
    markCompleted(id)
  }
})
</script>

<template>
  <div class="tool-page driving-study">
    <h1>📚 科目一系统学习</h1>

    <!-- 加载中 -->
    <div v-if="loading" class="card" style="text-align:center;padding:40px">
      <p style="color:var(--text-muted)">正在加载学习资料...</p>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="card error-msg" style="padding:20px">
      {{ error }}
      <button class="btn btn-sm" style="margin-top:12px" @click="loadData">重试</button>
    </div>

    <!-- 概览页 -->
    <div v-else-if="view === 'overview'" class="study-overview">
      <div class="card study-progress" style="margin-bottom:20px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="font-size:16px">学习进度</h3>
          <span style="font-size:14px;color:var(--text-secondary)">{{ completedCount }} / {{ totalCount }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <p style="margin-top:10px;color:var(--text-secondary);font-size:13px">
          已完成 {{ progressPercent }}%
        </p>
        <button
          v-if="completedCount < totalCount"
          class="btn"
          style="margin-top:16px;width:100%"
          @click="continueStudy"
        >
          {{ completedCount === 0 ? '开始学习' : '继续学习' }}
        </button>
        <button v-else class="btn" style="margin-top:16px;width:100%" @click="startStudy()">
          重新学习
        </button>
        <button
          class="btn btn-secondary"
          style="margin-top:12px;width:100%"
          @click="router.push('/driving/traffic-signs')"
        >
          查看全部标志图库
        </button>
      </div>

      <div class="study-chapters">
        <div
          class="card chapter-card gallery-card"
          @click="router.push('/driving/traffic-signs')"
        >
          <div class="chapter-header">
            <h3>🚦 交通标志图库</h3>
            <span class="chapter-count">230 个标志</span>
          </div>
          <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;margin:0">
            系统收录深圳交警 213 个标志图解和 GB 5768 标准 23 页图集，支持分类筛选、搜索和详情查看，与学习/刷题形成一站式闭环。
          </p>
        </div>

        <div v-for="ch in chapters" :key="ch.id" class="card chapter-card">
          <div class="chapter-header">
            <h3>{{ ch.title }}</h3>
            <span class="chapter-count">{{ (ch.topics || []).filter(t => isCompleted(t.id)).length }} / {{ (ch.topics || []).length }}</span>
          </div>
          <div class="topic-list">
            <button
              v-for="topic in ch.topics"
              :key="topic.id"
              class="topic-item"
              :class="{ completed: isCompleted(topic.id) }"
              @click="goToTopic(topic.id)"
            >
              <img
                v-if="topic.image"
                :src="topic.image"
                class="topic-thumb"
                :alt="topic.title"
                @error="$event.target.style.display = 'none'"
              >
              <span class="topic-status">{{ isCompleted(topic.id) ? '✓' : '○' }}</span>
              <span class="topic-title">{{ topic.title }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习页 -->
    <div v-else-if="view === 'topic'" class="study-topic">
      <div class="card study-header" style="margin-bottom:16px;padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:13px;color:var(--text-secondary)">
            {{ currentChapter?.title }} · {{ topicIndex }} / {{ totalCount }}
          </span>
          <button class="btn btn-sm btn-secondary" @click="goHome">返回概览</button>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <div class="card topic-card" style="padding:20px;margin-bottom:16px">
        <h2 style="font-size:20px;margin-bottom:16px">{{ currentTopic?.title }}</h2>
        <div v-if="currentTopic?.image" class="topic-image">
          <img :src="currentTopic.image" :alt="currentTopic.title" @error="$event.target.style.display='none'">
        </div>
        <p class="topic-content">{{ currentTopic?.content }}</p>
        <div v-if="currentTopic?.tip" class="tip-box">
          <strong>💡 速记口诀：</strong>{{ currentTopic.tip }}
        </div>
      </div>

      <div class="topic-actions">
        <button class="btn btn-secondary" :disabled="!hasPrev" @click="prevTopic">← 上一节</button>
        <button class="btn" @click="goToQuiz">练习本章</button>
        <button class="btn btn-primary" @click="completeAndNext">
          {{ hasNext ? '下一节 →' : '完成学习' }}
        </button>
      </div>
    </div>

    <!-- 完成页 -->
    <div v-else-if="view === 'finish'" class="study-finish">
      <div class="card" style="text-align:center;padding:40px">
        <div style="font-size:48px;margin-bottom:16px">🎉</div>
        <h2 style="margin-bottom:12px">恭喜完成科目一系统学习！</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px">
          共学习 {{ totalCount }} 个知识点，现在可以去刷题巩固了。
        </p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn" @click="router.push('/driving/quiz')">去刷题</button>
          <button class="btn btn-secondary" @click="goHome">返回概览</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.driving-study {
  max-width: 800px;
}

.progress-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s;
}

.study-progress {
  margin-bottom: 20px;
}

.study-chapters {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chapter-card {
  padding: 16px;
}
.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.chapter-header h3 {
  font-size: 16px;
}
.chapter-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.topic-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}
.topic-item:hover {
  border-color: var(--accent);
}
.topic-item.completed {
  border-color: var(--success);
  color: var(--success);
}
.topic-status {
  font-size: 13px;
  width: 20px;
  text-align: center;
}
.topic-title {
  font-size: 14px;
}
.topic-thumb {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: var(--radius);
  background: var(--bg-tertiary);
  flex-shrink: 0;
}
.gallery-card {
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}
.gallery-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}

.topic-image {
  text-align: center;
  margin-bottom: 16px;
}
.topic-image img {
  max-width: 100%;
  max-height: 200px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.topic-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.tip-box {
  padding: 14px;
  background: var(--bg-secondary);
  border-left: 4px solid var(--accent);
  border-radius: var(--radius);
  font-size: 14px;
  line-height: 1.6;
}

.topic-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .topic-actions {
    flex-direction: column;
  }
  .chapter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
