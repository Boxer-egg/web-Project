# 科目一系统学习页面实现计划

> **For agentic workers:** REQUIRED SUB-_SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为驾考刷题工具新增 `/tools/driving-license-study` 科目一系统学习页面，采用课程式向导，支持章节进度持久化和章节练习跳转。

**Architecture:** 新增独立 Vue 页面组件 + composable 管理学习数据与进度，静态 JSON 存放章节化学习内容，通过 URL 参数与现有刷题页联动实现按章节练习。

**Tech Stack:** Vue 3 Composition API, Vue Router, @vueuse/core useStorage, 现有工具站样式体系。

---

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/public/data/driving-license-study.json` | 创建 | 科目一学习章节与知识点数据 |
| `frontend/src/composables/useDrivingStudy.js` | 创建 | 学习数据加载、进度读写、导航计算 |
| `frontend/src/views/tools/DrivingLicenseStudy.vue` | 创建 | 学习页面主组件 |
| `frontend/src/router/index.js` | 修改 | 注册 `/tools/driving-license-study` 路由 |
| `frontend/src/components/Sidebar.vue` | 修改 | 新增侧边栏入口 |
| `frontend/src/views/tools/DrivingLicenseQuiz.vue` | 修改 | 支持 `chapter` URL 参数筛选题目 |

---

## Task 1: 创建学习数据 JSON

**Files:**
- Create: `frontend/public/data/driving-license-study.json`

- [ ] **Step 1: 写入学习数据文件**

```json
{
  "meta": {
    "title": "科目一系统学习",
    "subject": 1,
    "licenseType": "C1",
    "version": "2026.06"
  },
  "chapters": [
    {
      "id": "traffic-signs",
      "title": "交通信号与标志",
      "order": 1,
      "topics": [
        {
          "id": "warning-pedestrian",
          "title": "警告标志：注意行人",
          "content": "蓝底三角形，内有一个行人图案，用于警告驾驶人减速慢行，注意行人。常见场景包括学校、居民小区、人行横道前。",
          "tip": "蓝三角、黄三角，警告标志要记牢；看见行人早减速。",
          "image": "signs/pedestrian.svg",
          "quizChapter": "交通标志"
        },
        {
          "id": "prohibition-no-entry",
          "title": "禁令标志：禁止通行",
          "content": "红色圆圈空白，是禁止通行标志，表示禁止一切车辆和行人通行。通常设置在施工路段、危险区域或单向道路出口。",
          "tip": "红圈白底一杠红，禁止通行莫强冲。",
          "image": "signs/no-entry.svg",
          "quizChapter": "交通标志"
        }
      ]
    },
    {
      "id": "license-rules",
      "title": "驾驶证管理规定",
      "order": 2,
      "topics": [
        {
          "id": "license-probation",
          "title": "实习期规定",
          "content": "机动车驾驶人初次取得汽车类准驾车型后的12个月为实习期。实习期内驾驶机动车应当在车身后部粘贴或悬挂统一式样的实习标志。",
          "tip": "初次领证12个月，实习标志要贴稳。",
          "image": "",
          "quizChapter": "驾驶证"
        },
        {
          "id": "license-validity",
          "title": "驾驶证有效期",
          "content": "机动车驾驶证有效期分为六年、十年和长期。在有效期满前九十日内可申请换证。",
          "tip": "六年十年和长期，期满之前要换证。",
          "image": "",
          "quizChapter": "驾驶证"
        }
      ]
    },
    {
      "id": "road-rules",
      "title": "道路通行规则",
      "order": 3,
      "topics": [
        {
          "id": "speed-limit-no-center",
          "title": "无中心线城市道路限速",
          "content": "在没有道路中心线的城市道路上，最高时速不得超过30公里；公路上不得超过40公里。",
          "tip": "无中心线城市30，公路40要牢记。",
          "image": "",
          "quizChapter": "限速"
        },
        {
          "id": "highway-max-speed",
          "title": "高速公路最高车速",
          "content": "高速公路最高车速不得超过每小时120公里，最低车速不得低于每小时60公里。",
          "tip": "高速上限120，下限60别忘记。",
          "image": "",
          "quizChapter": "高速公路"
        }
      ]
    },
    {
      "id": "violations",
      "title": "违法处罚与安全驾驶",
      "order": 4,
      "topics": [
        {
          "id": "drunk-driving",
          "title": "酒驾与醉驾标准",
          "content": "车辆驾驶人员血液中的酒精含量大于或等于20mg/100ml、小于80mg/100ml属于饮酒驾驶；大于或等于80mg/100ml属于醉酒驾驶。",
          "tip": "20算酒驾，80算醉驾，喝酒绝对不开车。",
          "image": "",
          "quizChapter": "酒驾"
        },
        {
          "id": "emergency-light",
          "title": "车辆故障时的灯光使用",
          "content": "机动车在道路上发生故障，需要停车排除故障时，驾驶人应当立即开启危险报警闪光灯，将机动车移至不妨碍交通的地方停放。",
          "tip": "车辆故障停路边，双闪开启要明显。",
          "image": "",
          "quizChapter": "应急处理"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: 验证 JSON 格式**

Run: `cd /Users/box/new/Mac/web-Project/frontend && node -e "JSON.parse(require('fs').readFileSync('public/data/driving-license-study.json'))"`
Expected: 无报错。

- [ ] **Step 3: 提交**

```bash
git add frontend/public/data/driving-license-study.json
git commit -m "data: add subject 1 study chapters and topics"
```

---

## Task 2: 创建 useDrivingStudy composable

**Files:**
- Create: `frontend/src/composables/useDrivingStudy.js`

- [ ] **Step 1: 创建 composable 文件**

```javascript
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

const STORAGE_KEY = 'driving-study-progress'

/**
 * 管理科目一学习数据与进度。
 * @returns {{
 *   data: import('vue').Ref<object>,
 *   loading: import('vue').Ref<boolean>,
 *   error: import('vue').Ref<string>,
 *   progress: import('vue').ComputedRef<Set<string>>,
 *   chapters: import('vue').ComputedRef<Array>,
 *   allTopicIds: import('vue').ComputedRef<Array<string>>,
 *   completedCount: import('vue').ComputedRef<number>,
 *   totalCount: import('vue').ComputedRef<number>,
 *   loadData: () => Promise<void>,
 *   isCompleted: (topicId: string) => boolean,
 *   markCompleted: (topicId: string) => void,
 *   getTopicIndex: (topicId: string) => number,
 *   findTopicById: (topicId: string) => object | null,
 *   getNextTopicId: (topicId: string) => string | null,
 *   getPrevTopicId: (topicId: string) => string | null,
 *   getChapterForTopic: (topicId: string) => object | null
 * }}
 */
export function useDrivingStudy() {
  const data = ref({ meta: {}, chapters: [] })
  const loading = ref(false)
  const error = ref('')
  const progress = useStorage(STORAGE_KEY, [])

  const chapters = computed(() => {
    const list = data.value.chapters || []
    return [...list].sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  const allTopicIds = computed(() => {
    return chapters.value.flatMap(ch => (ch.topics || []).map(t => t.id))
  })

  const completedCount = computed(() => {
    const set = new Set(progress.value)
    return allTopicIds.value.filter(id => set.has(id)).length
  })

  const totalCount = computed(() => allTopicIds.value.length)

  async function loadData() {
    loading.value = true
    error.value = ''
    try {
      const res = await fetch('/data/driving-license-study.json')
      if (!res.ok) throw new Error('学习资料加载失败')
      data.value = await res.json()
    } catch (e) {
      error.value = '学习资料加载失败：' + e.message
    } finally {
      loading.value = false
    }
  }

  function isCompleted(topicId) {
    return progress.value.includes(topicId)
  }

  function markCompleted(topicId) {
    if (!progress.value.includes(topicId)) {
      progress.value = [...progress.value, topicId]
    }
  }

  function findTopicById(topicId) {
    for (const ch of chapters.value) {
      const topic = (ch.topics || []).find(t => t.id === topicId)
      if (topic) return { chapter: ch, topic }
    }
    return null
  }

  function getTopicIndex(topicId) {
    return allTopicIds.value.indexOf(topicId)
  }

  function getNextTopicId(topicId) {
    const idx = getTopicIndex(topicId)
    return allTopicIds.value[idx + 1] || null
  }

  function getPrevTopicId(topicId) {
    const idx = getTopicIndex(topicId)
    return allTopicIds.value[idx - 1] || null
  }

  function getChapterForTopic(topicId) {
    const found = findTopicById(topicId)
    return found ? found.chapter : null
  }

  return {
    data,
    loading,
    error,
    progress,
    chapters,
    allTopicIds,
    completedCount,
    totalCount,
    loadData,
    isCompleted,
    markCompleted,
    findTopicById,
    getTopicIndex,
    getNextTopicId,
    getPrevTopicId,
    getChapterForTopic,
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/composables/useDrivingStudy.js
git commit -m "feat(study): add useDrivingStudy composable for data and progress"
```

---

## Task 3: 创建 DrivingLicenseStudy.vue 页面

**Files:**
- Create: `frontend/src/views/tools/DrivingLicenseStudy.vue`

- [ ] **Step 1: 创建页面组件**

```vue
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDrivingStudy } from '../../composables/useDrivingStudy.js'

const route = useRoute()
const router = useRouter()

const {
  data,
  loading,
  error,
  chapters,
  completedCount,
  totalCount,
  loadData,
  isCompleted,
  markCompleted,
  findTopicById,
  getNextTopicId,
  getPrevTopicId,
  getChapterForTopic,
} = useDrivingStudy()

/** 当前视图：overview | topic | finish */
const view = ref('overview')
/** 当前知识点 ID */
const currentTopicId = ref('')

const progressPercent = computed(() => {
  if (!totalCount.value) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const currentTopic = computed(() => {
  const found = findTopicById(currentTopicId.value)
  return found ? found.topic : null
})

const currentChapter = computed(() => {
  return getChapterForTopic(currentTopicId.value)
})

const topicIndex = computed(() => {
  return Math.max(0, chapters.value.flatMap(ch => ch.topics || []).findIndex(t => t.id === currentTopicId.value) + 1)
})

const hasNext = computed(() => !!getNextTopicId(currentTopicId.value))
const hasPrev = computed(() => !!getPrevTopicId(currentTopicId.value))

function startStudy(topicId) {
  currentTopicId.value = topicId || chapters.value[0]?.topics?.[0]?.id || ''
  view.value = 'topic'
}

function continueStudy() {
  const firstIncomplete = chapters.value
    .flatMap(ch => ch.topics || [])
    .find(t => !isCompleted(t.id))
  startStudy(firstIncomplete?.id)
}

function goToTopic(topicId) {
  currentTopicId.value = topicId
  view.value = 'topic'
}

function nextTopic() {
  const next = getNextTopicId(currentTopicId.value)
  if (next) {
    currentTopicId.value = next
  } else {
    view.value = 'finish'
  }
}

function prevTopic() {
  const prev = getPrevTopicId(currentTopicId.value)
  if (prev) currentTopicId.value = prev
}

function completeAndNext() {
  markCompleted(currentTopicId.value)
  nextTopic()
}

function goToQuiz() {
  const chapter = currentChapter.value
  const quizChapter = currentTopic.value?.quizChapter || chapter?.title
  if (quizChapter) {
    router.push(`/tools/driving-license-quiz?mode=sequential&chapter=${encodeURIComponent(quizChapter)}`)
  }
}

function goHome() {
  view.value = 'overview'
}

onMounted(loadData)

watch(currentTopicId, (id) => {
  if (id && view.value === 'topic') {
    markCompleted(id)
  }
})
</script>

<template>
  <div class="tool-page driving-study">
    <h1>📚 科目一系统学习</h1>

    <!-- 加载中 -->
    <div v-if="loading" class="card" style="text-align:center;padding:40px">
      <p style="color:var(--text-muted)">正在加载学习资料...</p>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="card error-msg" style="padding:20px">
      {{ error }}
      <button class="btn btn-sm" style="margin-top:12px" @click="loadData">重试</button>
    </div>

    <!-- 概览页 -->
    <div v-else-if="view === 'overview'" class="study-overview">
      <div class="card study-progress" style="margin-bottom:20px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="font-size:16px">学习进度</h3>
          <span style="font-size:14px;color:var(--text-secondary)">{{ completedCount }} / {{ totalCount }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <p style="margin-top:10px;color:var(--text-secondary);font-size:13px">
          已完成 {{ progressPercent }}%
        </p>
        <button
          v-if="completedCount < totalCount"
          class="btn"
          style="margin-top:16px;width:100%"
          @click="continueStudy"
        >
          {{ completedCount === 0 ? '开始学习' : '继续学习' }}
        </button>
        <button v-else class="btn" style="margin-top:16px;width:100%" @click="startStudy()">
          重新学习
        </button>
      </div>

      <div class="study-chapters">
        <div v-for="ch in chapters" :key="ch.id" class="card chapter-card">
          <div class="chapter-header">
            <h3>{{ ch.title }}</h3>
            <span class="chapter-count">{{ (ch.topics || []).filter(t => isCompleted(t.id)).length }} / {{ (ch.topics || []).length }}</span>
          </div>
          <div class="topic-list">
            <button
              v-for="topic in ch.topics"
              :key="topic.id"
              class="topic-item"
              :class="{ completed: isCompleted(topic.id) }"
              @click="goToTopic(topic.id)"
            >
              <span class="topic-status">{{ isCompleted(topic.id) ? '✓' : '○' }}</span>
              <span class="topic-title">{{ topic.title }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习页 -->
    <div v-else-if="view === 'topic'" class="study-topic">
      <div class="card study-header" style="margin-bottom:16px;padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:13px;color:var(--text-secondary)">
            {{ currentChapter?.title }} · {{ topicIndex }} / {{ totalCount }}
          </span>
          <button class="btn btn-sm btn-secondary" @click="goHome">返回概览</button>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <div class="card topic-card" style="padding:20px;margin-bottom:16px">
        <h2 style="font-size:20px;margin-bottom:16px">{{ currentTopic?.title }}</h2>
        <div v-if="currentTopic?.image" class="topic-image">
          <img :src="currentTopic.image" :alt="currentTopic.title" @error="$event.target.style.display='none'">
        </div>
        <p class="topic-content">{{ currentTopic?.content }}</p>
        <div v-if="currentTopic?.tip" class="tip-box">
          <strong>💡 速记口诀：</strong>{{ currentTopic.tip }}
        </div>
      </div>

      <div class="topic-actions">
        <button class="btn btn-secondary" :disabled="!hasPrev" @click="prevTopic">← 上一节</button>
        <button class="btn" @click="goToQuiz">练习本章</button>
        <button class="btn btn-primary" @click="completeAndNext">
          {{ hasNext ? '下一节 →' : '完成学习' }}
        </button>
      </div>
    </div>

    <!-- 完成页 -->
    <div v-else-if="view === 'finish'" class="study-finish">
      <div class="card" style="text-align:center;padding:40px">
        <div style="font-size:48px;margin-bottom:16px">🎉</div>
        <h2 style="margin-bottom:12px">恭喜完成科目一系统学习！</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px">
          共学习 {{ totalCount }} 个知识点，现在可以去刷题巩固了。
        </p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn" @click="router.push('/tools/driving-license-quiz')">去刷题</button>
          <button class="btn btn-secondary" @click="goHome">返回概览</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.driving-study {
  max-width: 800px;
}

.progress-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s;
}

.study-progress {
  margin-bottom: 20px;
}

.study-chapters {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chapter-card {
  padding: 16px;
}
.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.chapter-header h3 {
  font-size: 16px;
}
.chapter-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.topic-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}
.topic-item:hover {
  border-color: var(--accent);
}
.topic-item.completed {
  border-color: var(--success);
  color: var(--success);
}
.topic-status {
  font-size: 13px;
  width: 20px;
  text-align: center;
}
.topic-title {
  font-size: 14px;
}

.topic-image {
  text-align: center;
  margin-bottom: 16px;
}
.topic-image img {
  max-width: 100%;
  max-height: 200px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.topic-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.tip-box {
  padding: 14px;
  background: var(--bg-secondary);
  border-left: 4px solid var(--accent);
  border-radius: var(--radius);
  font-size: 14px;
  line-height: 1.6;
}

.topic-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .topic-actions {
    flex-direction: column;
  }
  .chapter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/views/tools/DrivingLicenseStudy.vue
git commit -m "feat(study): add DrivingLicenseStudy page with overview, topic and finish views"
```

---

## Task 4: 注册路由

**Files:**
- Modify: `frontend/src/router/index.js`

- [ ] **Step 1: 在 driving-license-quiz 路由前/后插入新路由**

在 `frontend/src/router/index.js` 中约第 262 行（`driving-license-quiz` 路由之前）插入：

```javascript
    {
      path: '/tools/driving-license-study',
      name: 'driving-license-study',
      component: () => import('../views/tools/DrivingLicenseStudy.vue'),
      meta: {
        title: '科目一系统学习 - 驾考理论知识',
        description: '系统学习 C1/C2 科目一理论知识，按章节逐步掌握交通标志、通行规则、驾驶证规定和安全驾驶要点。'
      }
    },
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/router/index.js
git commit -m "feat(study): register driving-license-study route"
```

---

## Task 5: 更新侧边栏

**Files:**
- Modify: `frontend/src/components/Sidebar.vue`

- [ ] **Step 1: 在 tools 数组中驾考刷题下方新增入口**

找到 `frontend/src/components/Sidebar.vue` 第 48 行的 `{ path: '/tools/driving-license-quiz', name: '驾考刷题', icon: '🚗' }`，在其后添加：

```javascript
  { path: '/tools/driving-license-study', name: '科目一学习', icon: '📚' },
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/components/Sidebar.vue
git commit -m "feat(study): add subject 1 study entry to sidebar"
```

---

## Task 6: 刷题页支持按章节筛选

**Files:**
- Modify: `frontend/src/views/tools/DrivingLicenseQuiz.vue`

- [ ] **Step 1: 读取 URL chapter 参数**

在 `DrivingLicenseQuiz.vue` 的 `<script setup>` 顶部，现有 `import { ref, computed, onMounted, watch } from 'vue'` 之后添加：

```javascript
import { useRoute } from 'vue-router'

const route = useRoute()
```

- [ ] **Step 2: 修改 startSession 函数支持章节筛选**

将 `startSession` 函数中 `sequential` 分支的赋值：

```javascript
  } else {
    questions = [...bank.value.questions]
  }
```

替换为：

```javascript
  } else {
    const chapter = route.query.chapter
    if (chapter) {
      questions = bank.value.questions.filter(q => q.chapter === chapter)
      if (!questions.length) {
        error.value = `章节「${chapter}」暂无题目`
      }
    } else {
      questions = [...bank.value.questions]
    }
  }
```

- [ ] **Step 3: 在首页显示章节练习提示（可选）**

在 `view === 'home'` 的统计卡片上方，可添加一个提示条（如果 URL 携带 chapter）：

```html
      <div v-if="route.query.chapter" class="card" style="margin-bottom:16px;padding:12px;background:var(--bg-secondary)">
        <span style="font-size:14px">当前为「{{ route.query.chapter }}」章节练习</span>
      </div>
```

此步骤可选，但能提升用户体验。

- [ ] **Step 4: 提交**

```bash
git add frontend/src/views/tools/DrivingLicenseQuiz.vue
git commit -m "feat(quiz): support chapter filter via URL query param"
```

---

## Task 7: 本地验证

**Files:**
- 无新增文件

- [ ] **Step 1: 安装依赖并启动开发服务器**

Run:
```bash
cd /Users/box/new/Mac/web-Project/frontend
npm install
npm run dev
```

Expected: 开发服务器启动，终端显示本地 URL（如 `http://localhost:5173`）。

- [ ] **Step 2: 访问学习页面**

打开 `http://localhost:5173/tools/driving-license-study`。

Expected:
- 页面显示「科目一系统学习」标题
- 显示 4 个章节卡片
- 进度为 0%
- 点击「开始学习」进入第一个知识点

- [ ] **Step 3: 验证学习流程**

1. 点击「下一节」切换知识点。
2. 点击「练习本章」跳转刷题页。
3. 刷题页 URL 应包含 `chapter=交通标志` 或对应章节名。
4. 刷新学习页面，进度应保留。

- [ ] **Step 4: 验证侧边栏**

确认侧边栏「驾考刷题」下方有「科目一学习」入口，点击可进入学习页面。

- [ ] **Step 5: 验证移动端**

使用浏览器 DevTools 模拟手机宽度，确认：
- 章节卡片正常显示
- 底部操作按钮不重叠
- 进度条可见

---

## Task 8: 构建验证

**Files:**
- 无新增文件

- [ ] **Step 1: 运行生产构建**

Run:
```bash
cd /Users/box/new/Mac/web-Project/frontend
npm run build
```

Expected: 构建成功，无 TypeScript/Vite 错误。

- [ ] **Step 2: 检查构建产物**

Run:
```bash
ls -la /Users/box/new/Mac/web-Project/frontend/dist/data/driving-license-study.json
```

Expected: 学习数据 JSON 存在于构建产物中。

- [ ] **Step 3: 提交（如构建通过）**

若构建通过且无需代码改动，此任务无需单独提交。

---

## 自我审查

**Spec coverage:**
- 独立页面：Task 3 + Task 4 ✅
- 侧边栏入口：Task 5 ✅
- 章节概览与进度：Task 3 + Task 2 ✅
- 课程式向导：Task 3 ✅
- 练习本章跳转：Task 3 + Task 6 ✅
- 进度持久化：Task 2 ✅
- 移动端适配：Task 3 样式 + Task 7 ✅

**Placeholder scan:**
- 无 TBD/TODO/实现 later ✅
- 代码步骤均含完整代码 ✅

**Type consistency:**
- composable 返回的函数名在 Vue 组件中一致使用 ✅
- `quizChapter` / `chapter` 字段命名与刷题页 `q.chapter` 一致 ✅

---

## 执行交接

Plan complete and saved to `docs/superpowers/plans/2026-06-15-subject1-study-design.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
