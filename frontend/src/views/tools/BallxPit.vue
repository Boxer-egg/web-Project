<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import BallTree from '../../components/BallTree.vue'
import BallFusion from '../../components/BallFusion.vue'
import { TAG_LABELS } from '../../utils/ballxpitTags.js'

const data = ref({ balls: {}, baseBalls: [] })
const search = useStorage('ballxpit-search', '')
const expanded = useStorage('ballxpit-expanded', [])
const selected = useStorage('ballxpit-selected', null)
const lang = useStorage('ballxpit-lang', 'cn')
const mode = useStorage('ballxpit-mode', 'evolution')

onMounted(async () => {
  try {
    const res = await fetch('/data/ballxpit.json')
    data.value = await res.json()
  } catch (e) {
    console.error('Failed to load ballxpit data:', e)
  }
})

const balls = computed(() => data.value.balls || {})
const baseBalls = computed(() => data.value.baseBalls || [])

const selectedBall = computed(() => selected.value ? balls.value[selected.value] : null)

function ballList(names) {
  return names.map(n => balls.value[n]).filter(Boolean)
}

function displayName(ball) {
  if (!ball) return ''
  return lang.value === 'en' ? ball.name : (ball.nameCn || ball.name)
}

function imgUrl(img) {
  return `/images/ballxpit/${img}`
}

function selectBase(name) {
  if (selected.value === name) {
    selected.value = null
  } else {
    selected.value = name
    if (!expanded.value.includes(name)) {
      expanded.value.push(name)
    }
  }
}

function clearSearch() {
  search.value = ''
}

function onToggle(name) {
  const idx = expanded.value.indexOf(name)
  if (idx === -1) {
    expanded.value.push(name)
  } else {
    expanded.value.splice(idx, 1)
  }
}

function onSelect(name) {
  // Selecting a non-base ball just expands it; base balls use selectBase
  if (expanded.value.includes(name)) {
    expanded.value = expanded.value.filter(n => n !== name)
  } else {
    expanded.value.push(name)
  }
}

function ballMatches(b, term) {
  if (!b) return false
  const tagText = b.tags.map(t => `${t} ${TAG_LABELS[t] || ''}`).join(' ')
  const text = `${b.name} ${b.nameCn || ''} ${tagText} ${b.effect || ''} ${b.effectCn || ''}`.toLowerCase()
  return text.includes(term)
}

function hasMatchingDescendant(name, term, visited = new Set()) {
  if (visited.has(name)) return false
  visited.add(name)
  const b = balls.value[name]
  if (!b) return false
  if (ballMatches(b, term)) return true
  if (!b.children || !b.children.length) return false
  return b.children.some(c => hasMatchingDescendant(c, term, new Set(visited)))
}

function filteredBalls() {
  const term = search.value.trim().toLowerCase()
  const list = ballList(baseBalls.value)
  if (!term) return list
  // 全局搜索：返回所有匹配的弹珠（不限于基础弹珠）
  return Object.values(balls.value).filter(b => ballMatches(b, term))
}

const ballListForGrid = computed(() => filteredBalls())
const isSearching = computed(() => search.value.trim().length > 0)
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <div>
        <h1>🎱 BALL x PIT 合成表</h1>
        <p class="tool-desc">
          切换「进化」查看弹珠的进阶路线，或切换「融合」查看弹珠的合成配方。
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
          placeholder="搜索弹珠名称 / 标签 / 效果..."
        />
        <button v-if="search" class="search-clear" @click="clearSearch">×</button>
      </div>
      <button v-if="selected" class="btn btn-secondary" @click="selected = null">
        取消选择
      </button>
      <button v-if="expanded.length" class="btn btn-secondary" @click="expanded = []">
        全部收起
      </button>
    </div>

    <div class="tier-section">
      <h2 class="tier-title">
        <span v-if="!isSearching" class="tier-badge tier-0">T0</span>
        <span v-if="isSearching" class="tier-badge tier-2">搜</span>
        {{ isSearching ? '搜索结果' : '基础弹珠' }}
        <span class="tier-count">{{ ballListForGrid.length }}</span>
      </h2>
      <div class="ball-grid">
        <div
          v-for="ball in ballListForGrid"
          :key="ball.name"
          class="ball-card"
          :class="{ active: selected === ball.name }"
          @click="selectBase(ball.name)"
        >
          <img :src="imgUrl(ball.img)" :alt="displayName(ball)" class="ball-icon" />
          <div class="ball-name">{{ displayName(ball) }}</div>
          <div v-if="ball.children.length" class="ball-count">{{ ball.children.length }} 路线</div>
        </div>
      </div>
    </div>

    <div v-if="selectedBall" class="tree-panel">
      <div class="tree-header">
        <img :src="imgUrl(selectedBall.img)" class="tree-icon" :alt="displayName(selectedBall)" />
        <div class="tree-title">
          <h2>{{ displayName(selectedBall) }} 的{{ mode === 'evolution' ? '进化路线' : '融合配方' }}</h2>
          <p class="tree-meta">{{ mode === 'evolution' ? '点击下方卡片可继续展开下一级' : '查看该弹珠的合成方式与可参与合成的配方' }}</p>
        </div>
        <div class="tree-mode-toggle">
          <button
            class="btn btn-sm"
            :class="mode === 'evolution' ? 'btn-primary' : 'btn-secondary'"
            @click="mode = 'evolution'"
          >进化</button>
          <button
            class="btn btn-sm"
            :class="mode === 'fusion' ? 'btn-primary' : 'btn-secondary'"
            @click="mode = 'fusion'"
          >融合</button>
        </div>
      </div>
      <BallTree
        v-if="mode === 'evolution'"
        :balls="balls"
        :node-name="selectedBall.name"
        :expanded="expanded"
        :search="search"
        :lang="lang"
        :depth="0"
        @toggle="onToggle"
        @select="onSelect"
      />
      <BallFusion
        v-else
        :balls="balls"
        :ball-name="selectedBall.name"
        :lang="lang"
      />
    </div>

    <div v-if="!selectedBall" class="hint">
      提示：点击上方基础弹珠查看进化路线或融合配方。使用搜索框可快速过滤。
    </div>
  </div>
</template>

<script>
export default {
  name: 'BallxPit'
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
.tree-mode-toggle {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
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
