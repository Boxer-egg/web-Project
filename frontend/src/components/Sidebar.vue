<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const collapsed = ref(false)

const tools = [
  { path: '/', name: '首页', icon: '🏠' },
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
]
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
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
      <RouterLink
        v-for="tool in tools"
        :key="tool.path"
        :to="tool.path"
        class="nav-item"
        :class="{ active: route.path.startsWith(tool.path) }"
      >
        <span class="nav-icon">{{ tool.icon }}</span>
        <span v-if="!collapsed" class="nav-text">{{ tool.name }}</span>
      </RouterLink>
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

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    bottom: 0;
    top: auto;
    border-right: none;
    border-top: 1px solid var(--border);
    flex-direction: row;
    overflow-x: auto;
  }
  .sidebar.collapsed {
    width: 100%;
  }
  .sidebar-header {
    display: none;
  }
  .nav {
    flex-direction: row;
    padding: 4px;
    gap: 2px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .nav::-webkit-scrollbar {
    display: none;
  }
  .nav-item {
    flex-direction: column;
    padding: 6px 8px;
    gap: 2px;
    font-size: 11px;
    min-width: 60px;
    justify-content: center;
  }
  .nav-icon {
    font-size: 18px;
  }
}
</style>
