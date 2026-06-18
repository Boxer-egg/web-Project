<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const meta = ref(null)
const loading = ref(true)
const pageLoading = ref(false)
const error = ref('')
const currentPage = ref(1)
const pageCache = ref({})
const showAnswer = ref({})

const totalCount = computed(() => meta.value?.total || 0)
const pageSize = computed(() => meta.value?.pageSize || 20)
const totalPages = computed(() => meta.value?.totalPages || 1)

const pagedQuestions = computed(() => pageCache.value[currentPage.value] || [])

async function loadMeta() {
  try {
    const res = await fetch('/data/jsyks-kms4/meta.json')
    if (!res.ok) throw new Error('题库索引加载失败')
    meta.value = await res.json()
    currentPage.value = 1
    await loadPage(1)
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function loadPage(p) {
  if (!meta.value || p < 1 || p > totalPages.value) return
  if (pageCache.value[p]) {
    currentPage.value = p
    showAnswer.value = {}
    scrollTop()
    prefetchPage(p + 1)
    return
  }
  pageLoading.value = true
  try {
    const res = await fetch(`/data/jsyks-kms4/pages/page-${p.toString().padStart(3, '0')}.json`)
    if (!res.ok) throw new Error(`第 ${p} 页加载失败`)
    const data = await res.json()
    pageCache.value[p] = data
    currentPage.value = p
    showAnswer.value = {}
    scrollTop()
    prefetchPage(p + 1)
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    pageLoading.value = false
  }
}

function prefetchPage(p) {
  if (!meta.value || p < 1 || p > totalPages.value || pageCache.value[p]) return
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = `/data/jsyks-kms4/pages/page-${p.toString().padStart(3, '0')}.json`
  link.as = 'fetch'
  link.onload = () => link.remove()
  document.head.appendChild(link)
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function parseQuestion(tm, tx) {
  const parts = (tm || '').split(/<br\s*\/?>/i).map(s => s.trim()).filter(Boolean)
  const stem = parts[0] || ''
  const options = tx === 1 ? ['正确', '错误'] : parts.slice(1)
  return { stem, options }
}

function imagePath(tp) {
  if (!tp) return ''
  const base = tp.replace(/\.[^.]+$/, '')
  return `/images/jsyks-kms4/${base}.webp`
}

function optionLabel(index) {
  return String.fromCharCode(65 + index)
}

function toggleAnswer(globalIndex) {
  showAnswer.value[globalIndex] = !showAnswer.value[globalIndex]
}

function goPage(p) {
  const target = Math.min(Math.max(1, p), totalPages.value)
  if (target !== currentPage.value) {
    loadPage(target)
  }
}

function onKeydown(e) {
  if (e.key === 'ArrowLeft') {
    goPage(currentPage.value - 1)
  } else if (e.key === 'ArrowRight') {
    goPage(currentPage.value + 1)
  }
}

onMounted(() => {
  loadMeta()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="tool-page jsyks-kms4">
    <h1>🚙 科目四顺序练习</h1>

    <div v-if="loading" class="card" style="text-align:center;padding:40px">
      正在加载题库...
    </div>
    <div v-else-if="error" class="card error-msg" style="padding:20px">
      {{ error }}
      <button class="btn btn-sm" style="margin-top:12px" @click="loadMeta">重试</button>
    </div>
    <template v-else>
      <div class="card summary" style="padding:16px;margin-bottom:16px">
        <div class="summary-row">
          <span>共 {{ totalCount }} 题，每页 {{ pageSize }} 题</span>
          <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
        </div>
      </div>

      <div v-if="pageLoading" class="card" style="text-align:center;padding:40px">
        正在加载第 {{ currentPage }} 页...
      </div>

      <div v-else class="question-list">
        <div
          v-for="(q, idx) in pagedQuestions"
          :key="q.tkId"
          class="card question-card"
        >
          <div class="question-header">
            <span class="question-index">第 {{ (currentPage - 1) * pageSize + idx + 1 }} 题</span>
            <span v-if="q.tags" class="question-tags">{{ q.tags.split('|').join(' · ') }}</span>
          </div>

          <p class="question-stem">{{ parseQuestion(q.tm, q.tx).stem }}</p>

          <div v-if="q.tp" class="question-image">
            <img
              :src="imagePath(q.tp)"
              alt="题图"
              loading="lazy"
              decoding="async"
              @error="$event.target.style.display='none'"
            >
          </div>

          <ol class="options">
            <li
              v-for="(opt, oidx) in parseQuestion(q.tm, q.tx).options"
              :key="oidx"
              :class="{ correct: showAnswer[(currentPage - 1) * pageSize + idx] && q.da === (q.tx === 1 ? opt : optionLabel(oidx)) }"
            >
              <span class="opt-label">{{ optionLabel(oidx) }}.</span>
              <span class="opt-text">{{ opt }}</span>
            </li>
          </ol>

          <div class="answer-row">
            <button
              class="btn btn-sm btn-secondary"
              @click="toggleAnswer((currentPage - 1) * pageSize + idx)"
            >
              {{ showAnswer[(currentPage - 1) * pageSize + idx] ? '隐藏答案' : '显示答案' }}
            </button>
            <span v-if="showAnswer[(currentPage - 1) * pageSize + idx]" class="answer-text">
              答案：<b>{{ q.da }}</b>
            </span>
          </div>
        </div>
      </div>

      <div class="card pagination-card" style="padding:16px">
        <div class="pagination">
          <button class="btn btn-sm" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">上一页</button>

          <input
            v-model.number="currentPage"
            type="number"
            min="1"
            :max="totalPages"
            class="page-input"
            @change="goPage(currentPage)"
          >
          <span class="page-total">/ {{ totalPages }}</span>

          <button class="btn btn-sm" :disabled="currentPage === totalPages" @click="goPage(currentPage + 1)">下一页</button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.jsyks-kms4 {
  max-width: 800px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);
}
.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}
.question-card {
  padding: 20px;
}
.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.question-index {
  font-size: 13px;
  color: var(--text-muted);
}
.question-tags {
  font-size: 12px;
  color: var(--accent);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 12px;
}
.question-stem {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.6;
  margin: 0 0 14px;
}
.question-image {
  margin-bottom: 14px;
}
.question-image img {
  max-width: 100%;
  max-height: 260px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  display: block;
}
.options {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.options li {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  font-size: 15px;
  line-height: 1.5;
}
.options li.correct {
  border-color: var(--success);
  background: rgba(34, 197, 94, 0.08);
}
.opt-label {
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.answer-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.answer-text {
  font-size: 15px;
  color: var(--success);
}
.pagination-card {
  display: flex;
  justify-content: center;
}
.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
}
.page-input {
  width: 60px;
  padding: 6px 8px;
  text-align: center;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
}
.page-total {
  font-size: 14px;
  color: var(--text-secondary);
}

@media (max-width: 600px) {
  .question-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .summary-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
