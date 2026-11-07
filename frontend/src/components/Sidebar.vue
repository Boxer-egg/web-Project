<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { toolGroups } from '../data/toolGroups'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const route = useRoute()
const collapsed = ref(false)
const expandedGroups = ref({})
const search = ref('')
const STORAGE_KEY = 'sidebar-groups-expanded'

// Close sidebar on route change on mobile
watch(() => route.path, () => {
  emit('close')
})

/** Return groups whose tools match the current search query. */
const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  return groups
    .map(group => {
      if (!group.title) return group
      if (!q) return group
      const matchedTools = group.tools.filter(tool => {
        const haystack = [tool.name, ...(tool.keywords || [])].join(' ').toLowerCase()
        return haystack.includes(q)
      })
      return { ...group, tools: matchedTools }
    })
    .filter(group => !group.title || group.tools.length > 0 || !q)
})

const groups = [
  {
    title: '',
    tools: [
      { path: '/', name: '首页', icon: '🏠', keywords: ['shouye', 'home'] },
    ]
  },
  ...toolGroups
]

/** Determine which group contains the current route. */
function findActiveGroupTitle() {
  for (const group of groups) {
    if (!group.title) continue
    const active = group.tools.some(tool =>
      route.path === tool.path
    )
    if (active) return group.title
  }
  return ''
}

/** Load saved group expansion state from localStorage. */
function loadExpandedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    expandedGroups.value = raw ? JSON.parse(raw) : {}
  } catch {
    expandedGroups.value = {}
  }
}

/** Persist group expansion state to localStorage. */
function saveExpandedState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedGroups.value))
  } catch {
    // Ignore storage errors (e.g. private mode).
  }
}

/** Check whether a named group is currently expanded. */
function isExpanded(title) {
  return !!expandedGroups.value[title]
}

/** Toggle expansion for a named group. */
function toggleGroup(title) {
  expandedGroups.value[title] = !isExpanded(title)
  saveExpandedState()
}

/** Ensure the active route's group is always expanded. */
function expandActiveGroup() {
  const activeTitle = findActiveGroupTitle()
  if (activeTitle && !isExpanded(activeTitle)) {
    expandedGroups.value[activeTitle] = true
    saveExpandedState()
  }
}

onMounted(() => {
  loadExpandedState()
  expandActiveGroup()
})

watch(() => route.path, expandActiveGroup)
</script>

<template>
  <div v-if="isOpen" class="sidebar-overlay" @click="emit('close')"></div>
  <aside class="sidebar" :class="{ collapsed, 'mobile-open': isOpen }">
    <div class="sidebar-header">
      <RouterLink to="/" class="logo">
        <span class="logo-icon">🧰</span>
        <span v-if="!collapsed" class="logo-text">在线工具箱</span>
      </RouterLink>
      <button class="toggle-btn" @click="collapsed = !collapsed">
        {{ collapsed ? '→' : '←' }}
      </button>
    </div>
    <div v-if="!collapsed" class="search-box">
      <div class="search-input-wrap">
        <input
          v-model="search"
          class="search-input"
          type="text"
          placeholder="搜索工具，如 BMI、番茄钟、password…"
        >
        <button
          v-if="search"
          class="search-clear"
          title="清除"
          @click="search = ''"
        >×</button>
      </div>
    </div>
    <nav class="nav">
      <template v-for="group in filteredGroups" :key="group.title || 'home'">
        <div class="nav-group">
          <!-- Collapsed sidebar: show tool icons only, no group headers. -->
          <template v-if="collapsed">
            <RouterLink
              v-for="tool in group.tools"
              :key="tool.path"
              :to="tool.path"
              class="nav-item"
              :class="{ active: route.path === tool.path }"
              :title="tool.name"
            >
              <span class="nav-icon">{{ tool.icon }}</span>
            </RouterLink>
          </template>

          <!-- Expanded sidebar: show collapsible group headers. -->
          <template v-else>
            <button
              v-if="group.title"
              class="nav-group-header"
              :class="{ expanded: isExpanded(group.title) || search.trim() }"
              @click="toggleGroup(group.title)"
            >
              <span>{{ group.title }}</span>
              <span class="group-arrow">▸</span>
            </button>
            <div
              v-show="!group.title || isExpanded(group.title) || search.trim()"
              class="nav-group-tools"
            >
              <RouterLink
                v-for="tool in group.tools"
                :key="tool.path"
                :to="tool.path"
                class="nav-item"
                :class="{ active: route.path === tool.path }"
              >
                <span class="nav-icon">{{ tool.icon }}</span>
                <span class="nav-text">{{ tool.name }}</span>
              </RouterLink>
            </div>
          </template>
        </div>
      </template>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  z-index: 20;
}
.sidebar.collapsed {
  width: 60px;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--border);
  height: var(--header-height);
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 15px;
  overflow: hidden;
  white-space: nowrap;
}
.logo-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: 12px 8px;
}
.toggle-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2px 6px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 12px;
}
.search-box {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}
.search-input {
  width: 100%;
  padding: 8px 30px 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus {
  border-color: var(--accent);
}
.search-input::placeholder {
  color: var(--text-muted);
}
.search-input-wrap {
  position: relative;
}
.search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--border);
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
}
.search-clear:hover {
  background: var(--error);
  color: white;
}
.nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.nav-group-header:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
.group-arrow {
  transition: transform 0.2s;
  font-size: 12px;
}
.nav-group-header.expanded .group-arrow {
  transform: rotate(90deg);
}
.nav-group-tools {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
}
.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
.nav-item.active {
  background: var(--accent);
  color: white;
}
.nav-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.nav-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .sidebar {
    width: 260px;
    height: 100vh;
    position: fixed;
    left: -260px;
    top: 0;
    bottom: auto;
    border-right: 1px solid var(--border);
    border-top: none;
    flex-direction: column;
    overflow-x: hidden;
    transition: left 0.3s ease;
    background: var(--bg-primary);
  }
  .sidebar.mobile-open {
    left: 0;
  }
  .sidebar.collapsed {
    width: 260px;
  }
  .sidebar-header {
    display: flex;
  }
  .nav {
    flex-direction: column;
    padding: 8px;
    gap: 4px;
    overflow-y: auto;
  }
  .nav-item {
    flex-direction: row;
    padding: 10px 12px;
    gap: 10px;
    font-size: 14px;
    min-width: 0;
    justify-content: flex-start;
  }
  .nav-icon {
    font-size: 16px;
  }
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 15;
  }
}
</style>
