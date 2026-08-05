<script setup>
import { ref, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import Toast from './components/Toast.vue'
import FeedbackWidget from './components/FeedbackWidget.vue'

const route = useRoute()
const isDark = ref(false)
const isSidebarOpen = ref(false)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})
</script>

<template>
  <div class="app">
    <Toast />
    <Sidebar :isOpen="isSidebarOpen" @close="isSidebarOpen = false" />
    <main class="main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-btn" @click="toggleSidebar">☰</button>
          <h2 class="page-title">{{ route.meta?.title || '在线工具箱' }}</h2>
        </div>
        <button class="theme-btn" @click="toggleTheme" :title="isDark ? '切换浅色' : '切换深色'">
          <span v-if="isDark">☀️</span>
          <span v-else>🌙</span>
        </button>
      </header>
      <div class="content">
        <RouterView />
      </div>
    </main>
    <FeedbackWidget />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  min-height: 100vh;
}
.main {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
}
.topbar {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-primary);
  position: sticky;
  top: 0;
  z-index: 10;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-primary);
  cursor: pointer;
  padding: 4px;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}
.theme-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}
.theme-btn:hover {
  background: var(--bg-secondary);
}
.content {
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .main {
    margin-left: 0;
  }
  .topbar {
    padding: 0 12px;
  }
  .menu-btn {
    display: block;
  }
}
</style>
