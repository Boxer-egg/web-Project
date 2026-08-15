<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import PassiveFusion from '../../components/PassiveFusion.vue'

const data = ref({ items: {}, baseItems: [] })
const search = useStorage('ballxpit-passives-search', '')
const selected = useStorage('ballxpit-passives-selected', null)
const lang = useStorage('ballxpit-passives-lang', 'cn')

onMounted(async () => {
  try {
    const res = await fetch('/data/ballxpit-passives.json')
    data.value = await res.json()
  } catch (e) {
    console.error('Failed to load passive items data:', e)
  }
})

const items = computed(() => data.value.items || {})
const baseItems = computed(() => data.value.baseItems || [])

const selectedItem = computed(() => selected.value ? items.value[selected.value] : null)

function itemList(names) {
  return names.map(n => items.value[n]).filter(Boolean)
}

function displayName(item) {
  if (!item) return ''
  return lang.value === 'en' ? item.name : (item.nameCn || item.name)
}

function imgUrl(img) {
  return `/images/ballxpit/${img}`
}

function selectItem(name) {
  if (selected.value === name) {
    selected.value = null
  } else {
    selected.value = name
  }
}

function clearSearch() {
  search.value = ''
}

function itemMatches(i, term) {
  if (!i) return false
  const text = `${i.name} ${i.nameCn || ''} ${i.effect || ''} ${i.effectCn || ''}`.toLowerCase()
  return text.includes(term)
}

function filteredItems() {
  const term = search.value.trim().toLowerCase()
  const list = itemList(baseItems.value)
  if (!term) return list
  // 全局搜索：返回所有匹配的道具
  return Object.values(items.value).filter(i => itemMatches(i, term))
}

const itemListForGrid = computed(() => filteredItems())
const isSearching = computed(() => search.value.trim().length > 0)
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <div>
        <h1>🧪 BALL x PIT 道具合成表</h1>
        <p class="tool-desc">
          查询被动道具的合成配方，点击任意道具查看「合成此道具」与「可参与合成」两种配方。
        </p>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-sm"
          :class="lang === 'cn' ? 'btn-primary' : 'btn-secondary'"
          @click="lang = 'cn'"
        >中文</button>
        <button
          class="btn btn-sm"
          :class="lang === 'en' ? 'btn-primary' : 'btn-secondary'"
          @click="lang = 'en'"
        >English</button>
      </div>
    </div>

    <div class="controls">
      <div class="search-box">
        <input
          v-model="search"
          type="text"
          placeholder="搜索道具名称 / 效果..."
        />
        <button v-if="search" class="search-clear" @click="clearSearch">×</button>
      </div>
      <button v-if="selected" class="btn btn-secondary" @click="selected = null">
        取消选择
      </button>
    </div>

    <div class="tier-section">
      <h2 class="tier-title">
        <span v-if="!isSearching" class="tier-badge tier-0">基</span>
        <span v-if="isSearching" class="tier-badge tier-2">搜</span>
        {{ isSearching ? '搜索结果' : '基础道具' }}
        <span class="tier-count">{{ itemListForGrid.length }}</span>
      </h2>
      <div class="ball-grid">
        <div
          v-for="item in itemListForGrid"
          :key="item.name"
          class="ball-card"
          :class="{ active: selected === item.name }"
          @click="selectItem(item.name)"
        >
          <img :src="imgUrl(item.img)" :alt="displayName(item)" class="ball-icon" />
          <div class="ball-name">{{ displayName(item) }}</div>
          <div v-if="item.children.length" class="ball-count">{{ item.children.length }} 配方</div>
        </div>
      </div>
    </div>

    <div v-if="selectedItem" class="tree-panel">
      <div class="tree-header">
        <img :src="imgUrl(selectedItem.img)" class="tree-icon" :alt="displayName(selectedItem)" />
        <div class="tree-title">
          <h2>{{ displayName(selectedItem) }} 的合成配方</h2>
          <p class="tree-meta">查看该道具的合成方式与可参与合成的配方</p>
        </div>
      </div>
      <PassiveFusion
        :items="items"
        :item-name="selectedItem.name"
        :lang="lang"
      />
    </div>

    <div v-if="!selectedItem" class="hint">
      提示：点击上方基础道具查看合成配方。使用搜索框可快速过滤。
    </div>
  </div>
</template>

<script>
export default {
  name: 'BallxPitPassives'
}
</script>

<style scoped>
.tool-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
}
.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}
.search-box input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
}
.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 18px;
}
.tier-section {
  margin-bottom: 24px;
}
.tier-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}
.tier-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  color: white;
}
.tier-0 { background: #58a6ff; }
.tier-1 { background: #3fb950; }
.tier-2 { background: #a371f7; }
.tier-count {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 400;
}
.ball-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
}
.ball-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
}
.ball-card:hover,
.ball-card.active {
  border-color: var(--accent);
  background: var(--bg-tertiary);
}
.ball-icon {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: var(--bg-primary);
  object-fit: contain;
}
.ball-name {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  margin-top: 6px;
  word-break: break-word;
}
.ball-count {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}
.tree-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}
.tree-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.tree-title {
  flex: 1;
  min-width: 0;
}
.tree-title h2 {
  margin: 0;
}
.tree-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: var(--bg-primary);
  object-fit: contain;
}
.tree-meta {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 2px;
}
.hint {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 20px;
  background: var(--bg-secondary);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}
@media (max-width: 768px) {
  .ball-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  }
  .ball-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
