<script setup>
import { ref, watch, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const route = useRoute()
const collapsed = ref(false)
const expandedGroups = ref({})
const STORAGE_KEY = 'sidebar-groups-expanded'

// Close sidebar on route change on mobile
watch(() => route.path, () => {
  emit('close')
})

const groups = [
  {
    title: '',
    tools: [
      { path: '/', name: '首页', icon: '🏠' },
    ]
  },
  {
    title: '开发者工具',
    tools: [
      { path: '/tools/json-formatter', name: 'JSON 格式化', icon: '📋' },
      { path: '/tools/base64', name: 'Base64 编解码', icon: '🔐' },
      { path: '/tools/url-encoder', name: 'URL 编解码', icon: '🔗' },
      { path: '/tools/regex', name: '正则测试', icon: '🔍' },
      { path: '/tools/timestamp', name: '时间戳转换', icon: '⏰' },
      { path: '/tools/color', name: '颜色转换器', icon: '🎨' },
      { path: '/tools/markdown', name: 'Markdown 预览', icon: '📝' },
      { path: '/tools/text-diff', name: '文本差异对比', icon: '📊' },
      { path: '/tools/code-formatter', name: '代码格式化', icon: '💻' },
      { path: '/tools/password', name: '密码生成器', icon: '🔑' },
      { path: '/tools/jwt-decoder', name: 'JWT 解码器', icon: '📜' },
      { path: '/tools/uuid-generator', name: 'UUID 生成器', icon: '🆔' },
      { path: '/tools/hash-calculator', name: 'Hash 计算器', icon: '#️⃣' },
      { path: '/tools/html-entity', name: 'HTML 实体', icon: '🔤' },
      { path: '/tools/text-toolbox', name: '文本工具箱', icon: '🧰' },
      { path: '/tools/number-converter', name: '进制转换', icon: '🔢' },
      { path: '/tools/json-csv', name: 'JSON↔CSV', icon: '📑' },
      { path: '/tools/qrcode', name: '二维码', icon: '▣' },
      { path: '/tools/css-unit', name: 'CSS单位', icon: '📐' },
      { path: '/tools/lorem-ipsum', name: '假文生成', icon: '📝' },
      { path: '/tools/word-counter', name: '字数统计', icon: '📝' },
      { path: '/tools/unit-converter', name: '单位换算', icon: '📐' },
      { path: '/tools/bmi', name: 'BMI 计算', icon: '⚖️' },
      { path: '/tools/chinese-converter', name: '简繁转换', icon: '🈷️' },
      { path: '/tools/date-calculator', name: '日期计算', icon: '📅' },
      { path: '/tools/pomodoro', name: '番茄钟', icon: '🍅' },
      { path: '/tools/timer', name: '专业计时器', icon: '⏱️' },
    ]
  },
  {
    title: '交通学习',
    tools: [
      { path: '/driving/license-study', name: '科目一学习', icon: '📚' },
      { path: '/driving/quiz', name: '驾考刷题', icon: '🚗' },
      { path: '/driving/traffic-signs', name: '交通标志图库', icon: '🚦' },
      { path: '/driving/jk', name: '科目四顺序练习', icon: '🚌' },
    ]
  }
]

/** Determine which group contains the current route. */
function findActiveGroupTitle() {
  for (const group of groups) {
    if (!group.title) continue
    const active = group.tools.some(tool =>
      tool.path === '/' ? route.path === '/' : route.path.startsWith(tool.path)
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
        <span v-if="!collapsed" class="logo-text">开发者工具箱</span>
      </RouterLink>
      <button class="toggle-btn" @click="collapsed = !collapsed">
        {{ collapsed ? '→' : '←' }}
      </button>
    </div>
    <nav class="nav">
      <template v-for="group in groups" :key="group.title || 'home'">
        <div class="nav-group">
          <!-- Collapsed sidebar: show tool icons only, no group headers. -->
          <template v-if="collapsed">
            <RouterLink
              v-for="tool in group.tools"
              :key="tool.path"
              :to="tool.path"
              class="nav-item"
              :class="{ active: tool.path === '/' ? route.path === '/' : route.path.startsWith(tool.path) }"
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
              :class="{ expanded: isExpanded(group.title) }"
              @click="toggleGroup(group.title)"
            >
              <span>{{ group.title }}</span>
              <span class="group-arrow">▸</span>
            </button>
            <div
              v-show="!group.title || isExpanded(group.title)"
              class="nav-group-tools"
            >
              <RouterLink
                v-for="tool in group.tools"
                :key="tool.path"
                :to="tool.path"
                class="nav-item"
                :class="{ active: tool.path === '/' ? route.path === '/' : route.path.startsWith(tool.path) }"
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
