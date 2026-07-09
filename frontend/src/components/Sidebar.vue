<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

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
  {
    title: '文本处理',
    tools: [
      { path: '/tools/text-toolbox', name: '文本工具箱', icon: '🧰', keywords: ['wenben', 'text', 'toolbox', 'daxiao', 'case', 'quchong', 'sort', 'fanzhuan', 'reverse'] },
      { path: '/tools/word-counter', name: '字数统计', icon: '📝', keywords: ['zishu', 'word', 'count', 'tongji', 'character'] },
      { path: '/tools/chinese-converter', name: '简繁转换', icon: '🈷️', keywords: ['jianfan', 'chinese', 'convert', 'simplified', 'traditional', 'fantizhongwen'] },
      { path: '/tools/lorem-ipsum', name: '假文生成', icon: '📝', keywords: ['jiawen', 'lorem', 'ipsum', 'dummy', 'placeholder', 'shengcheng'] },
      { path: '/tools/number-chinese', name: '数字转中文', icon: '🔢', keywords: ['shuzi', 'number', 'chinese', 'daxie', 'jine', 'renminbi', 'convert'] },
      { path: '/tools/pinyin', name: '文字转拼音', icon: '🔤', keywords: ['pinyin', 'wenzi', 'zhuanpin', 'fayin', 'yinjie'] },
      { path: '/tools/hanzi-info', name: '汉字信息', icon: '📖', keywords: ['hanzi', 'bushou', 'pianpang', 'bihua', 'pinyin', 'fayin'] },
      { path: '/tools/martian-text', name: '火星文翻译', icon: '👽', keywords: ['huoxingwen', 'martian', 'fanzhuan', 'wenzi'] },
      { path: '/tools/text-art', name: '文本颜艺', icon: '🎭', keywords: ['wenben', 'text', 'yanyi', 'kaomoji', 'yincang', 'yinxie'] },
    ]
  },
  {
    title: '商业测算',
    tools: [
      { path: '/tools/restaurant-profit', name: '餐饮盈利计算器', icon: '🍜', keywords: ['canyin', 'restaurant', 'profit', 'yingli', 'jisuan', 'kaidian', 'kuiyin'] },
      { path: '/tools/rpr', name: '餐饮反向调研', icon: '🕵️‍♂️', keywords: ['canyin', 'restaurant', 'reverse', 'fankui', 'diaoyan', 'jingpin', 'yingli', 'fanxuan'] },
    ]
  },
  {
    title: '转换计算',
    tools: [
      { path: '/tools/timestamp', name: '时间戳转换', icon: '⏰', keywords: ['shijianchuo', 'timestamp', 'date', 'unix', 'shijian'] },
      { path: '/tools/color', name: '颜色转换器', icon: '🎨', keywords: ['yanse', 'color', 'hex', 'rgb', 'hsl', 'convert'] },
      { path: '/tools/unit-converter', name: '单位换算', icon: '📐', keywords: ['danwei', 'unit', 'length', 'weight', 'temperature', 'huansuan'] },
      { path: '/tools/date-calculator', name: '日期计算', icon: '📅', keywords: ['riqi', 'date', 'jisuan', 'days', 'tianshu'] },
      { path: '/tools/calculator', name: '计算器', icon: '🧮', keywords: ['jisuanqi', 'calculator', 'compute', 'math'] },
      { path: '/tools/zip-plate-area', name: '邮编/车牌/区号', icon: '📮', keywords: ['youbian', 'chepai', 'quhao', 'zip', 'plate', 'area', 'postal'] },
      { path: '/tools/shelf-life', name: '保质期计算', icon: '🥫', keywords: ['baozhiqi', 'shelf', 'life', 'guoqi', 'expiry', 'date'] },
    ]
  },
  {
    title: '开发工具',
    tools: [
      { path: '/tools/json-formatter', name: 'JSON 格式化', icon: '📋', keywords: ['json', 'geshihua', 'ge shi hua', 'format', 'meihua', 'yasuo', 'compress'] },
      { path: '/tools/base64', name: 'Base64 编解码', icon: '🔐', keywords: ['base64', 'bianjiema', 'bian ma', 'jie ma', 'encode', 'decode'] },
      { path: '/tools/url-encoder', name: 'URL 编解码', icon: '🔗', keywords: ['url', 'bianjiema', 'encode', 'decode', 'percent', 'escape'] },
      { path: '/tools/regex', name: '正则测试', icon: '🔍', keywords: ['zhengze', 'regular', 'regex', 'regexp', 'test', 'pipei'] },
      { path: '/tools/code-formatter', name: '代码格式化', icon: '💻', keywords: ['code', 'daima', 'format', 'beautify', 'javascript', 'css', 'html'] },
      { path: '/tools/jwt-decoder', name: 'JWT 解码器', icon: '📜', keywords: ['jwt', 'jiema', 'decode', 'token', 'verify'] },
      { path: '/tools/uuid-generator', name: 'UUID 生成器', icon: '🆔', keywords: ['uuid', 'shengcheng', 'guid', 'generate', 'unique'] },
      { path: '/tools/hash-calculator', name: 'Hash 计算器', icon: '#️⃣', keywords: ['hash', 'md5', 'sha', 'jisuan', 'digest'] },
      { path: '/tools/html-entity', name: 'HTML 实体', icon: '🔤', keywords: ['html', 'shiti', 'entity', 'encode', 'decode'] },
      { path: '/tools/number-converter', name: '进制转换', icon: '🔢', keywords: ['jinzhi', 'jin zhi', 'binary', 'hex', 'octal', 'decimal', 'radix'] },
      { path: '/tools/json-csv', name: 'JSON↔CSV', icon: '📑', keywords: ['json', 'csv', 'convert', 'zhuanhuan', 'excel'] },
      { path: '/tools/css-unit', name: 'CSS单位', icon: '📐', keywords: ['css', 'danwei', 'unit', 'px', 'rem', 'em', 'vh', 'vw'] },
      { path: '/tools/markdown', name: 'Markdown 预览', icon: '📝', keywords: ['markdown', 'yulan', 'preview', 'md'] },
      { path: '/tools/text-diff', name: '文本差异对比', icon: '📊', keywords: ['wenben', 'text', 'chayi', 'diff', 'compare', 'duibi'] },
      { path: '/tools/yaml-json', name: 'YAML ↔ JSON', icon: '🔄', keywords: ['yaml', 'json', 'zhuanhuan', 'convert', 'jiaoHU'] },
    ]
  },
  {
    title: '图像分享',
    tools: [
      { path: '/tools/qrcode', name: '二维码', icon: '▣', keywords: ['erweima', 'qrcode', 'barcode', 'scan', 'shengcheng'] },
      { path: '/tools/image-canvas', name: '图片 Canvas 工具箱', icon: '🖌️', keywords: ['tupian', 'image', 'canvas', 'xiangsu', 'shuiyin', 'jiugongge', 'filter'] },
    ]
  },
  {
    title: '安全工具',
    tools: [
      { path: '/tools/password', name: '密码生成器', icon: '🔑', keywords: ['mima', 'password', 'suiji', 'random', 'generate'] },
      { path: '/tools/random-generator', name: '随机生成器', icon: '🎲', keywords: ['suiji', 'random', 'uuid', 'color', 'number', 'shengcheng'] },
    ]
  },
  {
    title: '效率生活',
    tools: [
      { path: '/tools/pomodoro', name: '番茄钟', icon: '🍅', keywords: ['fanqie', 'pomodoro', 'timer', 'zhong', 'jishi'] },
      { path: '/tools/timer', name: '专业计时器', icon: '⏱️', keywords: ['jishi', 'timer', 'stopwatch', 'countdown', 'daojishi'] },
      { path: '/tools/led-marquee', name: '手持 LED 弹幕', icon: '📱', keywords: ['shouchi', 'led', 'danmu', 'marquee', 'dengpai'] },
      { path: '/tools/relationship', name: '亲戚关系', icon: '👨‍👩‍👧‍👦', keywords: ['qinqi', 'relationship', 'qishu', 'chenghu', 'jiacheng'] },
      { path: '/tools/hello-world', name: 'Hello World', icon: '👋', keywords: ['hello', 'world', 'chengxu', 'yuyan', 'daima', 'fuzhi'] },
    ]
  },
  {
    title: '健康生活',
    tools: [
      { path: '/tools/bmi', name: 'BMI 计算', icon: '⚖️', keywords: ['bmi', 'shengao', 'tizhong', 'body', 'mass', 'index', 'jisuan'] },
      { path: '/tools/garbage-classification', name: '垃圾分类', icon: '♻️', keywords: ['laji', 'garbage', 'fenlei', 'recycle', 'huanbao'] },
      { path: '/tools/blood-type', name: '血型遗传', icon: '🩸', keywords: ['xuexing', 'blood', 'yichuan', 'inheritance', 'abo', 'rh'] },
    ]
  },
  {
    title: '驾考学习',
    tools: [
      { path: '/driving/license-study', name: '科目一学习', icon: '📚', keywords: ['kemu', 'subject', 'one', 'study', 'jiaxiao', 'xuexi'] },
      { path: '/driving/quiz', name: '驾考刷题', icon: '🚗', keywords: ['shuati', 'quiz', 'exam', 'jiaxiao', 'moni'] },
      { path: '/driving/traffic-signs', name: '交通标志图库', icon: '🚦', keywords: ['jiaotong', 'traffic', 'sign', 'biaozhi', 'tuku', 'tubiao'] },
      { path: '/driving/jk', name: '科目四顺序练习', icon: '🚌', keywords: ['kemu', 'subject', 'four', 'practice', 'jk', 'shunxu'] },
    ]
  }
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
