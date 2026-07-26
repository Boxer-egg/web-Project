<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { fetchWithTimeout } from '../../utils/fetchWithTimeout.js'

const signs = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const activeCategory = ref('全部')
const selectedSign = ref(null)
const currentPage = ref(1)
const PAGE_SIZE = 40

const categories = computed(() => {
  const set = new Set(signs.value.map(s => s.category).filter(Boolean))
  return ['全部', 'GB 5768 图集', '警告', '禁令', '指示', '指路', '标线', '其他'].filter(
    c => c === '全部' || set.has(c)
  )
})

const filteredSigns = computed(() => {
  let list = signs.value
  if (activeCategory.value !== '全部') {
    list = list.filter(s => s.category === activeCategory.value)
  }
  const kw = search.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(s => s.title.toLowerCase().includes(kw))
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredSigns.value.length / PAGE_SIZE)))

const pagedSigns = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredSigns.value.slice(start, start + PAGE_SIZE)
})

watch([search, activeCategory], () => {
  currentPage.value = 1
})

const selectedIndex = computed(() => {
  if (!selectedSign.value) return -1
  return filteredSigns.value.findIndex(s => s.id === selectedSign.value.id)
})

const hasPrev = computed(() => selectedIndex.value > 0)
const hasNext = computed(() => selectedIndex.value >= 0 && selectedIndex.value < filteredSigns.value.length - 1)

async function loadData() {
  try {
    const res = await fetchWithTimeout('/data/traffic-signs.json', {}, 15000)
    if (!res.ok) throw new Error('加载失败')
    const data = await res.json()
    signs.value = data.signs || []
  } catch (e) {
    error.value = e.message || '数据加载出错'
  } finally {
    loading.value = false
  }
}

function openDetail(sign) {
  selectedSign.value = sign
}

function closeDetail() {
  selectedSign.value = null
}

function prevSign() {
  if (!hasPrev.value) return
  selectedSign.value = filteredSigns.value[selectedIndex.value - 1]
}

function nextSign() {
  if (!hasNext.value) return
  selectedSign.value = filteredSigns.value[selectedIndex.value + 1]
}

function onKeydown(e) {
  if (!selectedSign.value) return
  if (e.key === 'Escape') {
    closeDetail()
  } else if (e.key === 'ArrowLeft') {
    prevSign()
  } else if (e.key === 'ArrowRight') {
    nextSign()
  }
}

let touchStartX = 0
function onTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX
}
function onTouchEnd(e) {
  const endX = e.changedTouches[0].screenX
  const delta = endX - touchStartX
  if (Math.abs(delta) < 50) return
  if (delta > 0) {
    prevSign()
  } else {
    nextSign()
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="tool-page traffic-sign-gallery">
    <h1>🚦 交通标志图库</h1>

    <div class="card controls" style="padding:16px;margin-bottom:16px">
      <input
        v-model="search"
        class="search-input"
        placeholder="搜索标志名称，如：注意行人"
      >
      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat"
          class="tab-btn"
          :class="{ active: activeCategory === cat }"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="card" style="text-align:center;padding:40px">
      正在加载图库...
    </div>
    <div v-else-if="error" class="card error-msg" style="padding:20px">
      {{ error }}
      <button class="btn btn-sm" style="margin-top:12px" @click="loadData">重试</button>
    </div>
    <div v-else-if="filteredSigns.length === 0" class="card" style="text-align:center;padding:40px">
      没有找到匹配的标志
    </div>
    <div v-else class="card summary" style="padding:12px 16px;margin-bottom:16px">
      <span style="font-size:14px;color:var(--text-secondary)">
        共 {{ filteredSigns.length }} 个标志，第 {{ currentPage }} / {{ totalPages }} 页
      </span>
    </div>
    <div v-if="pagedSigns.length" class="sign-grid">
      <div
        v-for="sign in pagedSigns"
        :key="sign.id"
        class="card sign-card"
        @click="openDetail(sign)"
      >
        <div class="sign-image-wrap">
          <img
            :src="sign.image"
            :alt="sign.title"
            loading="lazy"
            decoding="async"
            @error="$event.target.style.display = 'none'"
          >
        </div>
        <div class="sign-title">{{ sign.title }}</div>
        <span class="sign-category">{{ sign.category }}</span>
      </div>
    </div>

    <div v-if="totalPages > 1" class="card pagination-card" style="padding:16px;margin-top:16px">
      <div class="pagination">
        <button class="btn btn-sm" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
        <input
          v-model.number="currentPage"
          type="number"
          min="1"
          :max="totalPages"
          class="page-input"
          @change="currentPage = Math.min(Math.max(1, currentPage), totalPages)"
        >
        <span class="page-total">/ {{ totalPages }}</span>
        <button class="btn btn-sm" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
      </div>
    </div>

    <div
      v-if="selectedSign"
      class="modal-overlay"
      @click.self="closeDetail"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <div class="modal-card card">
        <button class="modal-close" @click="closeDetail">✕</button>
        <button
          v-if="hasPrev"
          class="nav-arrow nav-prev"
          @click.stop="prevSign"
        >
          ‹
        </button>
        <button
          v-if="hasNext"
          class="nav-arrow nav-next"
          @click.stop="nextSign"
        >
          ›
        </button>
        <h2>{{ selectedSign.title }}</h2>
        <div class="modal-image">
          <img :src="selectedSign.image" :alt="selectedSign.title" @error="$event.target.style.display = 'none'">
        </div>
        <p class="modal-desc">{{ selectedSign.description || '暂无说明' }}</p>
        <span class="sign-category">{{ selectedSign.category }}</span>
        <div class="modal-counter">
          {{ selectedIndex + 1 }} / {{ filteredSigns.length }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.traffic-sign-gallery {
  max-width: 1200px;
}
.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
}
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tab-btn {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.tab-btn:hover, .tab-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
.sign-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}
.sign-card {
  padding: 12px;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
  text-align: center;
}
.sign-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}
.sign-image-wrap {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  overflow: hidden;
}
.sign-image-wrap img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.sign-title {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 6px;
  line-height: 1.4;
}
.sign-category {
  font-size: 11px;
  color: var(--accent);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 12px;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-card {
  position: relative;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  text-align: center;
}
.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
}
.modal-image {
  margin: 16px 0;
}
.modal-image img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.modal-desc {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.modal-counter {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 10px;
}
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 101;
  transition: background 0.2s;
}
.nav-arrow:hover {
  background: rgba(255, 255, 255, 0.3);
}
.nav-prev {
  left: -64px;
}
.nav-next {
  right: -64px;
}

@media (max-width: 1100px) {
  .nav-prev {
    left: 8px;
  }
  .nav-next {
    right: 8px;
  }
}

.summary {
  display: flex;
  justify-content: center;
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
  .sign-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  .sign-image-wrap {
    height: 90px;
  }
  .nav-arrow {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }
  .nav-prev {
    left: 8px;
  }
  .nav-next {
    right: 8px;
  }
  .modal-card {
    padding: 16px;
  }
}
</style>
