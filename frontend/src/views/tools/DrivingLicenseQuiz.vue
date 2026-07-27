<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { matchMnemonics } from '../../logic/drivingMnemonics'
import { fetchWithTimeout } from '../../utils/fetchWithTimeout.js'
import { useCloudSync } from '../../composables/useCloudSync.js'

const route = useRoute()

/** 题目类型 */
const QUESTION_TYPES = {
  single: '单选题',
  multiple: '多选题',
  truefalse: '判断题',
}

/** 视图状态 */
const view = ref('home') // home | practice | exam | result
const mode = ref('sequential') // sequential | random | exam | wrong

/** 题库 */
const bank = ref({ meta: {}, questions: [] })
const loading = ref(false)
const error = ref('')

/** 当前会话 */
const sessionQuestions = ref([])
const currentIndex = ref(0)
const answers = ref({}) // { [questionId]: number[] }
const marked = ref([]) // 标记的题目索引
const startTime = ref(null)
const timeLeft = ref(0)
const timerId = ref(null)

/** 云同步（错题本与历史记录由 composable 共享管理） */
const {
  code: syncCode,
  wrongIds,
  quizHistory,
  syncing,
  syncError,
  lastSync,
  lastPull,
  push: syncUpload,
  pull: syncDownload,
  resetCode: resetSyncCode,
} = useCloudSync()

/** 题目答案缓存，避免 stats 计算时 O(n²) 查找 */
const answerMap = computed(() => {
  const map = new Map()
  for (const q of sessionQuestions.value) {
    map.set(q.id, (q.answer || []).slice().sort((a, b) => a - b))
  }
  return map
})

/** 统计 */
const stats = computed(() => {
  const total = sessionQuestions.value.length
  const answered = Object.keys(answers.value).length
  let correct = 0
  for (const [qid, ans] of Object.entries(answers.value)) {
    if (!ans.length) continue
    const expected = answerMap.value.get(qid)
    if (expected && arraysEqual(ans.slice().sort((a, b) => a - b), expected)) {
      correct++
    }
  }
  const wrong = answered - correct
  return { total, answered, correct, wrong }
})

const currentQuestion = computed(() => sessionQuestions.value[currentIndex.value] || null)

/** 当前题匹配到的口诀（仅答错时显示） */
const currentMnemonics = computed(() => {
  const q = currentQuestion.value
  if (!q || !showExplain.value) return []
  if (isCorrect(q.id)) return []
  return matchMnemonics(q).slice(0, 2)
})

/** 分数 */
const score = computed(() => {
  if (!sessionQuestions.value.length) return 0
  return Math.round((stats.value.correct / sessionQuestions.value.length) * 100)
})

const passScore = computed(() => bank.value.meta.passScore || 90)
const examDuration = computed(() => bank.value.meta.examDuration || 45)
const isPassed = computed(() => score.value >= passScore.value)

const isWrongBookSession = computed(() => mode.value === 'wrong')

/** 加载题库 */
async function loadBank() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetchWithTimeout('/data/driving-license-c4.json', {}, 15000)
    if (!res.ok) throw new Error('题库加载失败')
    bank.value = await res.json()
  } catch (e) {
    error.value = '题库加载失败：' + e.message
  } finally {
    loading.value = false
  }
}

/** 初始化会话 */
function startSession(selectedMode) {
  mode.value = selectedMode
  answers.value = {}
  marked.value = []
  currentIndex.value = 0

  let questions = []
  if (selectedMode === 'wrong') {
    questions = bank.value.questions.filter(q => wrongIds.value.includes(q.id))
    if (!questions.length) {
      error.value = '暂无错题'
      return
    }
  } else if (selectedMode === 'random') {
    questions = shuffleArray([...bank.value.questions]).slice(0, Math.min(50, bank.value.questions.length))
  } else if (selectedMode === 'exam') {
    questions = shuffleArray([...bank.value.questions]).slice(0, Math.min(100, bank.value.questions.length))
  } else {
    const chapter = route.query.chapter
    if (chapter) {
      questions = bank.value.questions.filter(q => q.chapter === chapter)
      if (!questions.length) {
        error.value = `章节「${chapter}」暂无题目`
        return
      }
    } else {
      questions = [...bank.value.questions]
    }
  }

  sessionQuestions.value = questions
  view.value = selectedMode === 'exam' ? 'exam' : 'practice'
  startTime.value = Date.now()

  if (selectedMode === 'exam') {
    timeLeft.value = examDuration.value * 60
    startTimer()
  } else {
    timeLeft.value = 0
    stopTimer()
  }
}

/** 计时器 */
function startTimer() {
  stopTimer()
  timerId.value = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      finishExam()
    }
  }, 1000)
}

function stopTimer() {
  if (timerId.value) {
    clearInterval(timerId.value)
    timerId.value = null
  }
}

/** 格式化时间 */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 答题 */
function selectOption(index) {
  if (!currentQuestion.value) return
  const qid = currentQuestion.value.id
  const type = currentQuestion.value.type

  if (type === 'multiple') {
    if (isLocked()) return
    const current = answers.value[qid] || []
    if (current.includes(index)) {
      answers.value[qid] = current.filter(i => i !== index)
    } else {
      answers.value[qid] = [...current, index].sort((a, b) => a - b)
    }
    showExplain.value = false
    return
  }

  // 单选/判断题：选择后立即显示对错并锁定
  answers.value[qid] = [index]
  showExplain.value = true
  handleAnswerResult(qid)
}

/** 提交多选题答案 */
function confirmMultiple() {
  if (!currentQuestion.value) return
  if (!isAnswered(currentQuestion.value.id)) {
    error.value = '请先选择答案'
    return
  }
  error.value = ''
  showExplain.value = true
  handleAnswerResult(currentQuestion.value.id)
}

/** 处理答题后的错题本逻辑 */
function handleAnswerResult(qid) {
  const correct = isCorrect(qid)
  if (isWrongBookSession.value) {
    if (correct) {
      removeWrong(qid)
    } else {
      addToWrongBookIfWrong(qid)
    }
  } else if (mode.value !== 'exam') {
    // 练习/随机模式下，只把实际答错的题加入错题本，不把未答题加入
    if (!correct) {
      addToWrongBookIfWrong(qid)
    }
  }
}

/** 当前题是否已锁定（单选/判断选中后，或多选提交后） */
function isLocked() {
  if (!currentQuestion.value) return false
  const type = currentQuestion.value.type
  if (type === 'multiple') return showExplain.value
  return isAnswered(currentQuestion.value.id)
}

/** 完成考试/练习 */
function finishExam() {
  stopTimer()
  if (mode.value === 'exam') {
    recordWrongAnswers()
    saveHistory()
  } else if (mode.value !== 'wrong') {
    // 练习/随机模式只保存历史，不批量记录未答题为错题
    saveHistory()
  }
  view.value = 'result'
}

/** 记录错题（仅考试模式使用） */
function recordWrongAnswers() {
  const wrong = sessionQuestions.value.filter(q => !isCorrect(q.id)).map(q => q.id)
  const set = new Set(wrongIds.value)
  wrong.forEach(id => set.add(id))
  wrongIds.value = Array.from(set)
}

/** 如果某题答错，立即加入错题本 */
function addToWrongBookIfWrong(qid) {
  if (!qid) return
  if (isCorrect(qid)) return
  if (!wrongIds.value.includes(qid)) {
    wrongIds.value = [...wrongIds.value, qid]
  }
}

/** 保存历史 */
function saveHistory() {
  const duration = Math.floor((Date.now() - startTime.value) / 1000)
  quizHistory.value.unshift({
    date: new Date().toISOString(),
    mode: mode.value,
    score: score.value,
    correct: stats.value.correct,
    wrong: stats.value.wrong,
    total: stats.value.total,
    duration,
    passed: mode.value === 'exam' ? isPassed.value : null,
  })
  if (quizHistory.value.length > 50) quizHistory.value = quizHistory.value.slice(0, 50)
}

/** 错题本复习 */
function startWrongBook() {
  startSession('wrong')
}

/** 查看解析 */
const showExplain = ref(false)

/** 导航 */
function goTo(index) {
  currentIndex.value = index
  showExplain.value = false
  error.value = ''
}

function nextQuestion() {
  if (currentIndex.value < sessionQuestions.value.length - 1) {
    currentIndex.value++
    showExplain.value = false
    error.value = ''
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    showExplain.value = false
    error.value = ''
  }
}

/** 返回首页 */
function goHome() {
  stopTimer()
  view.value = 'home'
}

/** 重新练习 */
function restart() {
  startSession(mode.value)
}

/** 标记当前题 */
function toggleMark() {
  if (!currentQuestion.value) return
  const idx = currentIndex.value
  if (marked.value.includes(idx)) {
    marked.value = marked.value.filter(i => i !== idx)
  } else {
    marked.value = [...marked.value, idx]
  }
}

/** 打乱数组，使用加密安全随机数 */
function shuffleArray(arr) {
  const copy = [...arr]
  const cryptoObj = window.crypto || window.msCrypto
  for (let i = copy.length - 1; i > 0; i--) {
    let rand
    if (cryptoObj) {
      const arr32 = new Uint32Array(1)
      cryptoObj.getRandomValues(arr32)
      rand = arr32[0] / (0xffffffff + 1)
    } else {
      rand = Math.random()
    }
    const j = Math.floor(rand * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/** 是否已作答 */
function isAnswered(qid) {
  return qid != null && (answers.value[qid] || []).length > 0
}

/** 是否答对 */
function isCorrect(qid) {
  const ans = answers.value[qid] || []
  if (!ans.length) return false
  const expected = answerMap.value.get(qid)
  if (!expected) return false
  return arraysEqual(
    [...ans].sort((a, b) => a - b),
    expected
  )
}

/** 选项标签 */
function optionLabel(i) {
  return String.fromCharCode(65 + i)
}

onMounted(loadBank)

onUnmounted(stopTimer)
</script>

<template>
  <div class="tool-page driving-quiz">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>🚗 科目四刷题</h1>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="card" style="text-align:center;padding:40px">
      <p style="color:var(--text-muted)">正在加载题库...</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="error && view !== 'home'" class="error-msg" style="margin-bottom:16px">{{ error }}</div>

    <!-- 首页 -->
    <div v-if="view === 'home'" class="quiz-home">
      <div v-if="route.query.chapter" class="card" style="margin-bottom:16px;padding:12px;background:var(--bg-secondary)">
        <span style="font-size:14px">当前为「{{ route.query.chapter }}」章节练习</span>
      </div>

      <div class="quiz-stats card" style="margin-bottom:20px">
        <h3 style="font-size:16px;margin-bottom:12px">学习统计</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:16px">
          <div class="stat-item">
            <div class="stat-value">{{ bank.questions.length }}</div>
            <div class="stat-label">题库总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ wrongIds.length }}</div>
            <div class="stat-label">错题数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ quizHistory.length }}</div>
            <div class="stat-label">练习次数</div>
          </div>
        </div>
      </div>

      <div class="card sync-card" style="margin-bottom:20px;padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <h3 style="font-size:15px">☁️ 云同步</h3>
          <span v-if="syncCode" style="font-size:12px;color:var(--text-secondary);font-family:monospace;user-select:all" title="恢复码（点击全选复制）">{{ syncCode }}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <button class="btn btn-sm" :disabled="syncing" @click="syncUpload">
            {{ syncing ? '上传中…' : '上传到云端' }}
          </button>
          <button class="btn btn-sm btn-secondary" :disabled="syncing" @click="syncDownload">
            {{ syncing ? '下载中…' : '从云端恢复' }}
          </button>
          <button v-if="syncCode" class="btn btn-sm btn-secondary" @click="resetSyncCode">重置恢复码</button>
        </div>
        <div style="font-size:12px;color:var(--text-secondary)">
          <span v-if="lastSync">上次上传: {{ lastSync }}</span>
          <span v-if="lastPull" style="margin-left:12px">上次下载: {{ lastPull }}</span>
        </div>
        <div v-if="syncError" style="font-size:12px;color:var(--error);margin-top:4px">{{ syncError }}</div>
      </div>

      <div class="quiz-modes">
        <div class="mode-card card" @click="startSession('sequential')">
          <div class="mode-icon">📚</div>
          <h3>顺序练习</h3>
          <p>按题库顺序逐题学习</p>
        </div>
        <div class="mode-card card" @click="startSession('random')">
          <div class="mode-icon">🎲</div>
          <h3>随机抽题</h3>
          <p>随机打乱顺序练习</p>
        </div>
        <div class="mode-card card" @click="startSession('exam')">
          <div class="mode-icon">📝</div>
          <h3>模拟考试</h3>
          <p>100题 / 45分钟 / 90分及格</p>
        </div>
        <div class="mode-card card" @click="startWrongBook">
          <div class="mode-icon">❌</div>
          <h3>错题本</h3>
          <p>共 {{ wrongIds.length }} 道错题</p>
        </div>
      </div>

      <div v-if="quizHistory.length" class="card" style="margin-top:20px">
        <h3 style="font-size:16px;margin-bottom:12px">历史记录</h3>
        <div class="history-list">
          <div v-for="(h, i) in quizHistory.slice(0, 10)" :key="i" class="history-item">
            <span>{{ new Date(h.date).toLocaleString() }}</span>
            <span>{{ h.mode === 'exam' ? '模拟考试' : h.mode === 'wrong' ? '错题本' : h.mode === 'random' ? '随机练习' : '顺序练习' }}</span>
            <span :style="{ color: h.passed === true ? 'var(--success)' : h.passed === false ? 'var(--error)' : 'var(--text-secondary)' }">{{ h.score }}分</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 练习/考试界面 -->
    <div v-else-if="view === 'practice' || view === 'exam'" class="quiz-session">
      <div class="quiz-header card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <div>
            <span class="quiz-badge">{{ QUESTION_TYPES[currentQuestion?.type] }}</span>
            <span style="color:var(--text-secondary);font-size:14px;margin-left:8px">
              {{ currentIndex + 1 }} / {{ sessionQuestions.length }}
            </span>
            <span v-if="isWrongBookSession" class="quiz-badge" style="margin-left:8px;background:var(--warning)">错题本</span>
          </div>
          <div v-if="view === 'exam'" class="exam-timer" :class="{ warning: timeLeft < 300 }">
            ⏱️ {{ formatTime(timeLeft) }}
          </div>
        </div>
        <div class="progress-bar" style="margin-top:12px">
          <div class="progress-fill" :style="{ width: ((currentIndex + 1) / sessionQuestions.length * 100) + '%' }"></div>
        </div>
      </div>

      <div class="question-card card">
        <div v-if="currentQuestion?.picture" class="question-image">
          <img :src="currentQuestion.picture" :alt="currentQuestion.question" @error="$event.target.style.display='none'">
        </div>
        <h3 class="question-text">{{ currentQuestion?.question }}</h3>

        <div class="options-list">
          <button
            v-for="(opt, i) in currentQuestion?.options"
            :key="i"
            class="option-btn"
            :class="{
              selected: (answers[currentQuestion.id] || []).includes(i),
              correct: showExplain && (currentQuestion.answer || []).includes(i),
              wrong: showExplain && (answers[currentQuestion.id] || []).includes(i) && !(currentQuestion.answer || []).includes(i)
            }"
            :disabled="isLocked() && !(answers[currentQuestion.id] || []).includes(i) && !(currentQuestion.answer || []).includes(i)"
            @click="selectOption(i)"
          >
            <span class="option-label">{{ optionLabel(i) }}</span>
            <span class="option-text">{{ opt }}</span>
          </button>
        </div>

        <div class="question-actions">
          <button class="btn btn-secondary" @click="prevQuestion" :disabled="currentIndex === 0">上一题</button>
          <button v-if="currentQuestion?.type === 'multiple' && !showExplain" class="btn" @click="confirmMultiple">确认答案</button>
          <button class="btn" :class="{ 'btn-secondary': marked.includes(currentIndex) }" @click="toggleMark">
            {{ marked.includes(currentIndex) ? '取消标记' : '标记本题' }}
          </button>
          <button class="btn" @click="nextQuestion" :disabled="currentIndex === sessionQuestions.length - 1">下一题</button>
        </div>

        <div v-if="showExplain || (currentQuestion?.type !== 'multiple' && isAnswered(currentQuestion?.id))" class="explain-box">
          <strong>正确答案：</strong>{{ currentQuestion.answer.map(i => optionLabel(i)).join('、') }}<br>
          <strong>解析：</strong>{{ currentQuestion.explain || '暂无解析' }}
        </div>

        <div v-if="currentMnemonics.length" class="mnemonic-box">
          <strong>💡 记忆口诀</strong>
          <div v-for="(m, i) in currentMnemonics" :key="i" class="mnemonic-item">
            <div class="mnemonic-title">{{ m.title }}</div>
            <pre class="mnemonic-content">{{ m.content }}</pre>
          </div>
        </div>
      </div>

      <div class="quiz-footer">
        <div class="question-grid card">
          <button
            v-for="(q, i) in sessionQuestions"
            :key="q.id"
            class="grid-btn"
            :class="{
              current: i === currentIndex,
              answered: isAnswered(q.id),
              marked: marked.includes(i)
            }"
            @click="goTo(i)"
          >
            {{ i + 1 }}
          </button>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;flex-wrap:wrap;gap:12px">
          <button class="btn btn-secondary" @click="goHome">返回首页</button>
          <button class="btn" @click="finishExam">
            {{ mode === 'exam' ? '交卷' : mode === 'wrong' ? '完成错题本' : '结束练习' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 结果页 -->
    <div v-else-if="view === 'result'" class="quiz-result">
      <div class="card result-card" :class="{ passed: isPassed, failed: !isPassed }">
        <div class="result-score">{{ score }}<span>分</span></div>
        <div class="result-status">{{ mode === 'exam' ? (isPassed ? '恭喜，考试通过！' : '很遗憾，未通过') : '练习完成' }}</div>
        <div class="result-detail">
          <span>答对 {{ stats.correct }} 题</span>
          <span>答错 {{ stats.wrong }} 题</span>
          <span>未答 {{ stats.total - stats.answered }} 题</span>
        </div>
      </div>

      <div class="card" style="margin-top:20px">
        <h3 style="font-size:16px;margin-bottom:16px">错题回顾</h3>
        <div v-if="stats.wrong === 0" style="color:var(--text-muted);text-align:center;padding:20px">
          太棒了，全部答对！
        </div>
        <div v-else class="review-list">
          <div v-for="q in sessionQuestions.filter(x => !isCorrect(x.id))" :key="q.id" class="review-item">
            <p><strong>{{ q.question }}</strong></p>
            <p style="color:var(--error);font-size:13px;margin-top:4px">
              你的答案：{{ (answers[q.id] || []).map(i => optionLabel(i)).join('、') || '未答' }}
            </p>
            <p style="color:var(--success);font-size:13px">
              正确答案：{{ q.answer.map(i => optionLabel(i)).join('、') }}
            </p>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap">
        <button class="btn" @click="restart">重新{{ mode === 'exam' ? '考试' : mode === 'wrong' ? '错题本' : '练习' }}</button>
        <button class="btn btn-secondary" @click="goHome">返回首页</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.driving-quiz {
  max-width: 800px;
}

.quiz-stats {
  padding: 16px;
}
.stat-item {
  text-align: center;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.quiz-modes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}
.mode-card {
  cursor: pointer;
  padding: 24px 16px;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.mode-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.mode-icon {
  font-size: 36px;
  margin-bottom: 12px;
}
.mode-card h3 {
  font-size: 16px;
  margin-bottom: 6px;
}
.mode-card p {
  font-size: 13px;
  color: var(--text-secondary);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  font-size: 13px;
}

.quiz-header {
  padding: 16px;
  margin-bottom: 16px;
}
.quiz-badge {
  background: var(--accent);
  color: white;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
}
.exam-timer {
  font-size: 18px;
  font-weight: 600;
  font-family: monospace;
  color: var(--text-primary);
}
.exam-timer.warning {
  color: var(--error);
}
.progress-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s;
}

.question-card {
  padding: 20px;
  margin-bottom: 16px;
}
.question-image {
  text-align: center;
  margin-bottom: 16px;
}
.question-image img {
  max-width: 100%;
  max-height: 200px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.question-text {
  font-size: 17px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.option-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}
.option-btn:hover {
  border-color: var(--accent);
}
.option-btn.selected {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}
.option-btn.correct {
  border-color: var(--success);
  background: rgba(34, 197, 94, 0.1);
}
.option-btn.wrong {
  border-color: var(--error);
  background: rgba(239, 68, 68, 0.1);
}
.option-label {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-tertiary);
  font-size: 13px;
  font-weight: 600;
}
.option-btn.selected .option-label,
.option-btn.correct .option-label,
.option-btn.wrong .option-label {
  background: currentColor;
  color: white;
}
.option-text {
  font-size: 15px;
  line-height: 1.5;
}

.question-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}
.explain-box {
  padding: 14px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.mnemonic-box {
  margin-top: 12px;
  padding: 14px;
  background: color-mix(in srgb, var(--warning) 10%, var(--bg-secondary));
  border: 1px solid color-mix(in srgb, var(--warning) 30%, var(--border));
  border-radius: var(--radius);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.mnemonic-item {
  margin-top: 10px;
}
.mnemonic-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.mnemonic-content {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 13px;
}

.question-grid {
  padding: 12px;
}
.grid-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  cursor: pointer;
  font-size: 13px;
}
.grid-btn.current {
  border-color: var(--accent);
  background: var(--accent);
  color: white;
}
.grid-btn.answered {
  border-color: var(--success);
  color: var(--success);
}
.grid-btn.marked {
  border-style: dashed;
  border-color: var(--warning);
  color: var(--warning);
}

.result-card {
  text-align: center;
  padding: 40px 20px;
}
.result-card.passed {
  border-top: 4px solid var(--success);
}
.result-card.failed {
  border-top: 4px solid var(--error);
}
.result-score {
  font-size: 56px;
  font-weight: 700;
  color: var(--accent);
}
.result-score span {
  font-size: 20px;
  color: var(--text-secondary);
}
.result-status {
  font-size: 20px;
  margin: 12px 0;
}
.result-detail {
  display: flex;
  justify-content: center;
  gap: 24px;
  color: var(--text-secondary);
  font-size: 14px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.review-item {
  padding: 14px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  font-size: 14px;
}

@media (max-width: 600px) {
  .quiz-modes {
    grid-template-columns: 1fr 1fr;
  }
  .mode-card {
    padding: 18px 12px;
  }
  .mode-icon {
    font-size: 28px;
  }
  .question-actions {
    flex-direction: column;
  }
  .result-detail {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
