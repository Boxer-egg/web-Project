<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { getUrlParams } from '../../utils/urlParams'
import { search, getCategoryMeta } from '../../data/garbageData'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const query = useStorage('garbage-query', '')
const results = ref([])

const examples = ['电池', '塑料瓶', '剩饭', '餐巾纸', '榴莲壳', '过期药品']

function doSearch() {
  results.value = search(query.value)
}

watch(query, () => {
  doSearch()
})

onMounted(() => {
  const params = getUrlParams()
  if (params.get('q')) {
    query.value = params.get('q')
  }
  doSearch()
})

function setQuery(val) {
  query.value = val
}

function clearAll() {
  query.value = ''
  results.value = []
}

const grouped = computed(() => {
  const groups = {}
  for (const item of results.value) {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  }
  return groups
})

const categoryOrder = ['recyclable', 'hazardous', 'kitchen', 'other']
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>♻️ 垃圾分类查询</h1>
      <AiHelpPanel
        title="垃圾分类查询"
        desc="查询常见生活垃圾的所属分类和投放提示"
        api-tool="garbage"
        :params="[
          { name: 'q', desc: '垃圾名称', required: true, example: '电池' }
        ]"
      />
    </div>

    <div class="card search-bar">
      <div class="search-row">
        <input
          v-model="query"
          class="input"
          placeholder="输入垃圾名称，如：电池、塑料瓶、剩饭..."
          @keyup.enter="doSearch"
        >
        <button class="btn" @click="doSearch">查询</button>
        <button class="btn btn-secondary" @click="clearAll">清空</button>
      </div>
      <div class="examples">
        <span class="examples-label">常见示例：</span>
        <button
          v-for="ex in examples"
          :key="ex"
          class="example-chip"
          @click="setQuery(ex)"
        >
          {{ ex }}
        </button>
      </div>
    </div>

    <div v-if="query.trim() && !results.length" class="empty-state card">
      未找到“{{ query }}”的分类信息，试试其他关键词
    </div>

    <div class="results">
      <div
        v-for="cat in categoryOrder"
        :key="cat"
        v-show="grouped[cat]?.length"
        class="category-group card"
      >
        <div class="category-header" :style="{ background: getCategoryMeta(cat).color }">
          <span class="category-label">{{ getCategoryMeta(cat).label }}</span>
          <span class="category-desc">{{ getCategoryMeta(cat).desc }}</span>
          <span class="category-count">{{ grouped[cat]?.length }} 个</span>
        </div>
        <div class="items">
          <div
            v-for="item in grouped[cat]"
            :key="item.name"
            class="item"
          >
            <span class="item-name">{{ item.name }}</span>
            <span class="item-tip">{{ item.tip }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}
.search-bar {
  margin-bottom: 16px;
  padding: 16px;
}
.search-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.search-row .input {
  flex: 1;
  min-width: 200px;
}
.examples {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
}
.examples-label {
  color: var(--text-secondary);
}
.example-chip {
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.example-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.empty-state {
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
}
.results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.category-group {
  overflow: hidden;
  padding: 0;
}
.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: white;
  flex-wrap: wrap;
}
.category-label {
  font-size: 16px;
  font-weight: 600;
}
.category-desc {
  font-size: 13px;
  opacity: 0.9;
  flex: 1;
}
.category-count {
  font-size: 13px;
  opacity: 0.9;
}
.items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1px;
  background: var(--border);
}
.item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  background: var(--bg-primary);
}
.item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}
.item-tip {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}
</style>
