<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { getUrlParams } from '../../utils/urlParams'
import { useStorage } from '@vueuse/core'

// ============================================================
// Constants
// ============================================================
const MODES = { COUNTDOWN: 'countdown', COUNTUP: 'countup', CLOCK: 'clock' }

const PRESETS = [
  { label: '1 分钟', seconds: 60 },
  { label: '5 分钟', seconds: 300 },
  { label: '10 分钟', seconds: 600 },
  { label: '15 分钟', seconds: 900 },
  { label: '30 分钟', seconds: 1800 },
  { label: '45 分钟', seconds: 2700 },
  { label: '60 分钟', seconds: 3600 },
]

const TEMPLATES = [
  {
    name: '30 分钟会议',
    items: [
      { name: '开场介绍', duration: 180 },
      { name: '主题演讲', duration: 1200 },
      { name: '讨论问答', duration: 480 },
      { name: '总结收尾', duration: 120 },
    ],
  },
  {
    name: '45 分钟演讲 + Q&A',
    items: [
      { name: '嘉宾介绍', duration: 120 },
      { name: '主题演讲', duration: 2400 },
      { name: '观众问答', duration: 540 },
      { name: '结束致谢', duration: 60 },
    ],
  },
  {
    name: '产品发布会',
    items: [
      { name: '暖场', duration: 300 },
      { name: '开场致辞', duration: 300 },
      { name: '产品演示', duration: 1800 },
      { name: '价格公布', duration: 300 },
      { name: '媒体问答', duration: 600 },
    ],
  },
]

const MAX_DURATION = 86400 // 24 hours in seconds

// ============================================================
// State
// ============================================================
const timerMode = useStorage('timer-mode', MODES.COUNTDOWN)
const timerStatus = ref('idle') // 'idle' | 'running' | 'paused' | 'finished'
const isFullscreen = ref(false)
const soundEnabled = useStorage('timer-sound', true)
const soundVolume = useStorage('timer-volume', 0.3)
const use24Hour = useStorage('timer-24h', true)

// Countdown
const cdTotal = useStorage('timer-cd-total', 300)
const cdRemaining = ref(cdTotal.value)
const cdTarget = ref(0)

// Countup
const cuElapsed = ref(0)
const cuStart = ref(0)

// Clock
const clockNow = ref(new Date())

// Agenda (original data - never modified at runtime)
const agendaItems = useStorage('timer-agenda', [
  { name: '开场致辞', duration: 300 },
  { name: '主题演讲', duration: 1800 },
  { name: '中场休息', duration: 600 },
])

// Agenda runtime state (separate from original data)
const agendaRun = ref({
  active: false,
  index: 0,
  items: [], // { name, total, remaining, status }
})
const agendaTarget = ref(0)

// Overlay message
const overlayMessage = useStorage('timer-overlay', '')
const overlayInput = ref('')

// Usage log
const usageLog = useStorage('timer-log', [])

// Thresholds
const warningThreshold = useStorage('timer-warning', 60)
const dangerThreshold = useStorage('timer-danger', 10)
const stageNormalColor = useStorage('timer-stage-normal', '#3b82f6')
const stageWarningColor = useStorage('timer-stage-warning', '#f59e0b')
const stageDangerColor = useStorage('timer-stage-danger', '#ef4444')

// Audio context (lazy init)
let audioCtx = null

// Engine
let rafId = null
let lastSecondTick = 0
let clockInterval = null

// ============================================================
// Validation watchers
// ============================================================
watch(warningThreshold, (v) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 1) warningThreshold.value = 1
  if (n > MAX_DURATION) warningThreshold.value = MAX_DURATION
})

watch(dangerThreshold, (v) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 1) dangerThreshold.value = 1
  if (n > MAX_DURATION) dangerThreshold.value = MAX_DURATION
})

watch(soundVolume, (v) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) soundVolume.value = 0
  if (n > 1) soundVolume.value = 1
})

// ============================================================
// Helpers
// ============================================================
function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatClock(date) {
  let h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  if (!use24Hour.value) {
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${m}:${s} ${ampm}`
  }
  return `${String(h).padStart(2, '0')}:${m}:${s}`
}

function parseDurationInput(input) {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  // Try HH:MM:SS
  const hms = trimmed.match(/^(\d+):(\d{1,2}):(\d{1,2})$/)
  if (hms) {
    const h = parseInt(hms[1], 10)
    const m = parseInt(hms[2], 10)
    const s = parseInt(hms[3], 10)
    if (m < 60 && s < 60) return clampDuration(h * 3600 + m * 60 + s)
  }

  // Try MM:SS
  const ms = trimmed.match(/^(\d{1,2}):(\d{1,2})$/)
  if (ms) {
    const m = parseInt(ms[1], 10)
    const s = parseInt(ms[2], 10)
    if (s < 60) return clampDuration(m * 60 + s)
  }

  // Try plain number (seconds)
  const n = Number(trimmed)
  if (!Number.isNaN(n) && Number.isFinite(n) && n > 0) {
    return clampDuration(Math.floor(n))
  }

  return null
}

function clampDuration(seconds) {
  return Math.max(1, Math.min(MAX_DURATION, Math.floor(Number(seconds) || 1)))
}

function initAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return false
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return !!audioCtx
}

function playBeep(freq = 880, duration = 0.3) {
  if (!soundEnabled.value || !initAudio()) return
  try {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.value = freq
    const vol = Math.max(0, Math.min(1, Number(soundVolume.value) || 0))
    gain.gain.setValueAtTime(vol, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
    osc.start(audioCtx.currentTime)
    osc.stop(audioCtx.currentTime + duration)
  } catch {}
}

// ============================================================
// Logging
// ============================================================
function logEvent(type, detail = '') {
  const entry = {
    time: new Date().toISOString(),
    type,
    detail,
    mode: timerMode.value,
  }
  usageLog.value.unshift(entry)
  // Keep last 100 entries
  if (usageLog.value.length > 100) usageLog.value = usageLog.value.slice(0, 100)
}

function exportLogAsCsv() {
  if (!usageLog.value.length) return
  const rows = usageLog.value.map((e) => {
    const d = new Date(e.time)
    return `"${d.toLocaleString()}","${e.type}","${e.detail}","${e.mode}"`
  })
  const csv = '\uFEFF时间,类型,详情,模式\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `timer-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportLogAsPdf() {
  if (!usageLog.value.length) return
  const rows = usageLog.value.map((e) => {
    const d = new Date(e.time)
    return `<tr><td>${d.toLocaleString()}</td><td>${e.type}</td><td>${e.detail || ''}</td><td>${e.mode || ''}</td></tr>`
  }).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>计时器使用记录</title><style>
    body{font-family:sans-serif;padding:20px;max-width:900px;margin:0 auto}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th,td{padding:8px 12px;border:1px solid #ddd;text-align:left}
    th{background:#f5f5f5}
    h1{font-size:18px;margin-bottom:8px}
    .sub{color:#666;font-size:13px;margin-bottom:16px}</style></head><body>
    <h1>⏱ 计时器使用记录</h1><p class="sub">导出时间：${new Date().toLocaleString()}</p>
    <table><thead><tr><th>时间</th><th>类型</th><th>详情</th><th>模式</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`
  const win = window.open('', '_blank', 'width=900,height=600')
  if (win) {
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }
}

function clearLog() {
  usageLog.value = []
}

// ============================================================
// Engine
// ============================================================
function startEngine() {
  if (rafId) cancelAnimationFrame(rafId)
  lastSecondTick = Date.now()
  rafId = requestAnimationFrame(engineLoop)
}

function stopEngine() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function engineLoop() {
  const now = Date.now()
  // Update clock every frame for smooth display
  clockNow.value = new Date()

  // Second-level ticks
  if (now - lastSecondTick >= 1000) {
    lastSecondTick = now
    onSecondTick()
  }

  // Continue loop if anything is running
  if (timerStatus.value === 'running' || agendaRun.value.active) {
    rafId = requestAnimationFrame(engineLoop)
  }
}

function onSecondTick() {
  // Free timer modes
  if (timerStatus.value === 'running') {
    if (timerMode.value === MODES.COUNTDOWN) {
      const remaining = Math.ceil((cdTarget.value - Date.now()) / 1000)
      cdRemaining.value = Math.max(0, remaining)

      if (cdRemaining.value === warningThreshold.value) playBeep(660, 0.2)
      if (cdRemaining.value === dangerThreshold.value) playBeep(880, 0.4)
      if (cdRemaining.value <= 0) {
        cdRemaining.value = 0
        finishTimer('倒计时结束')
      }
    } else if (timerMode.value === MODES.COUNTUP) {
      cuElapsed.value = Math.floor((Date.now() - cuStart.value) / 1000)
    }
  }

  // Agenda
  if (agendaRun.value.active) {
    const item = agendaRun.value.items[agendaRun.value.index]
    if (item) {
      const remaining = Math.ceil((agendaTarget.value - Date.now()) / 1000)
      item.remaining = Math.max(0, remaining)

      if (item.remaining <= 0) {
        item.status = 'completed'
        logEvent('环节完成', item.name)
        playBeep(1100, 0.8)

        // Move to next
        if (agendaRun.value.index < agendaRun.value.items.length - 1) {
          agendaRun.value.index++
          const next = agendaRun.value.items[agendaRun.value.index]
          next.status = 'running'
          agendaTarget.value = Date.now() + next.remaining * 1000
        } else {
          agendaRun.value.active = false
          stopEngine()
          logEvent('节目单完成')
        }
      }
    }
  }
}

// ============================================================
// Timer Controls
// ============================================================
function startTimer() {
  if (timerStatus.value === 'finished') resetTimer()
  if (timerStatus.value !== 'idle' && timerStatus.value !== 'paused') return
  if (timerMode.value === MODES.CLOCK) return

  if (timerMode.value === MODES.COUNTDOWN) {
    if (cdRemaining.value <= 0) return
    cdTarget.value = Date.now() + cdRemaining.value * 1000
  } else if (timerMode.value === MODES.COUNTUP) {
    cuStart.value = Date.now() - cuElapsed.value * 1000
  }

  timerStatus.value = 'running'
  logEvent('开始计时')
  startEngine()
}

function pauseTimer() {
  if (timerStatus.value !== 'running') return

  if (timerMode.value === MODES.COUNTDOWN) {
    cdRemaining.value = Math.max(0, Math.ceil((cdTarget.value - Date.now()) / 1000))
  } else if (timerMode.value === MODES.COUNTUP) {
    cuElapsed.value = Math.floor((Date.now() - cuStart.value) / 1000)
  }

  timerStatus.value = 'paused'
  logEvent('暂停计时')

  // Stop engine if nothing else is running
  if (!agendaRun.value.active) stopEngine()
}

function resetTimer() {
  const wasRunning = timerStatus.value === 'running'
  timerStatus.value = 'idle'

  if (timerMode.value === MODES.COUNTDOWN) {
    cdRemaining.value = cdTotal.value
  } else if (timerMode.value === MODES.COUNTUP) {
    cuElapsed.value = 0
  }

  if (wasRunning) logEvent('重置计时')
  if (!agendaRun.value.active) stopEngine()
}

function finishTimer(detail = '') {
  timerStatus.value = 'finished'
  logEvent('计时结束', detail)
  playBeep(1100, 0.8)
  if (!agendaRun.value.active) stopEngine()
}

function setPreset(seconds) {
  const s = clampDuration(seconds)
  pauseTimer()
  resetTimer()
  cdTotal.value = s
  cdRemaining.value = s
  timerMode.value = MODES.COUNTDOWN
}

function adjustTimer(delta) {
  if (timerMode.value !== MODES.COUNTDOWN) return
  const newVal = clampDuration(cdRemaining.value + delta)
  cdRemaining.value = newVal
  if (timerStatus.value === 'idle' || timerStatus.value === 'finished') {
    cdTotal.value = newVal
  }
  if (timerStatus.value === 'running') {
    cdTarget.value = Date.now() + newVal * 1000
  }
}

function onCustomTimeInput(e) {
  const seconds = parseDurationInput(e.target.value)
  if (seconds !== null) {
    setPreset(seconds)
  }
  e.target.value = ''
}

function switchMode(newMode) {
  if (newMode === timerMode.value) return
  pauseTimer()
  resetTimer()
  // Also stop agenda if switching away
  if (agendaRun.value.active) {
    stopAgenda()
  }
  timerMode.value = newMode
}

// ============================================================
// Agenda Controls
// ============================================================
function startAgenda() {
  if (!agendaItems.value.length) return

  // Deep clone original data into runtime state - NEVER modify originals
  agendaRun.value.items = agendaItems.value.map((item) => {
    const dur = clampDuration(item.duration)
    return {
      name: String(item.name || '未命名').trim() || '未命名',
      total: dur,
      remaining: dur,
      status: 'pending',
    }
  })

  agendaRun.value.index = 0
  agendaRun.value.items[0].status = 'running'
  agendaRun.value.active = true

  agendaTarget.value = Date.now() + agendaRun.value.items[0].remaining * 1000
  logEvent('节目单开始')
  startEngine()
}

function stopAgenda() {
  if (!agendaRun.value.active) return
  agendaRun.value.active = false
  logEvent('节目单停止')
  if (timerStatus.value !== 'running') stopEngine()
}

function nextAgendaItem() {
  if (!agendaRun.value.active) return
  const item = agendaRun.value.items[agendaRun.value.index]
  if (item) {
    item.status = 'completed'
    logEvent('跳过环节', item.name)
  }
  if (agendaRun.value.index < agendaRun.value.items.length - 1) {
    agendaRun.value.index++
    const next = agendaRun.value.items[agendaRun.value.index]
    next.status = 'running'
    agendaTarget.value = Date.now() + next.remaining * 1000
  } else {
    stopAgenda()
  }
}

function prevAgendaItem() {
  if (!agendaRun.value.active || agendaRun.value.index <= 0) return
  agendaRun.value.items[agendaRun.value.index].status = 'pending'
  agendaRun.value.index--
  const prev = agendaRun.value.items[agendaRun.value.index]
  prev.status = 'running'
  prev.remaining = prev.total
  agendaTarget.value = Date.now() + prev.remaining * 1000
}

function skipAgendaItem() {
  if (!agendaRun.value.active) return
  const item = agendaRun.value.items[agendaRun.value.index]
  if (item) {
    item.status = 'skipped'
    logEvent('跳过环节', item.name)
  }
  if (agendaRun.value.index < agendaRun.value.items.length - 1) {
    agendaRun.value.index++
    const next = agendaRun.value.items[agendaRun.value.index]
    next.status = 'running'
    agendaTarget.value = Date.now() + next.remaining * 1000
  } else {
    stopAgenda()
  }
}

function addAgendaItem() {
  agendaItems.value.push({ name: '新环节', duration: 300 })
}

function removeAgendaItem(index) {
  if (index < 0 || index >= agendaItems.value.length) return
  agendaItems.value.splice(index, 1)
}

function moveAgendaItem(index, direction) {
  const arr = agendaItems.value
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= arr.length) return
  const temp = arr[index]
  arr[index] = arr[newIndex]
  arr[newIndex] = temp
}

function loadTemplate(tpl) {
  agendaItems.value = tpl.items.map((item) => ({ ...item }))
}

// ============================================================
// Overlay
// ============================================================
function setOverlay() {
  overlayMessage.value = overlayInput.value.trim()
  overlayInput.value = ''
}

function clearOverlay() {
  overlayMessage.value = ''
  overlayInput.value = ''
}

// ============================================================
// Fullscreen
// ============================================================
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

// ============================================================
// Keyboard Shortcuts
// ============================================================
function onKeydown(e) {
  if (e.target.isContentEditable) return
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return

  switch (e.code) {
    case 'Space':
      e.preventDefault()
      if (timerStatus.value === 'running') pauseTimer()
      else if (timerStatus.value === 'idle' || timerStatus.value === 'paused') startTimer()
      break
    case 'KeyR':
      e.preventDefault()
      resetTimer()
      break
    case 'KeyF':
      e.preventDefault()
      toggleFullscreen()
      break
    case 'ArrowUp':
      e.preventDefault()
      adjustTimer(60)
      break
    case 'ArrowDown':
      e.preventDefault()
      adjustTimer(-60)
      break
    case 'ArrowRight':
      e.preventDefault()
      if (agendaRun.value.active) nextAgendaItem()
      break
    case 'ArrowLeft':
      e.preventDefault()
      if (agendaRun.value.active) prevAgendaItem()
      break
    case 'KeyS':
      e.preventDefault()
      if (agendaRun.value.active) skipAgendaItem()
      break
  }
}

// ============================================================
// Visibility handling (tab background -> accurate timing)
// ============================================================
function onVisibilityChange() {
  if (document.hidden) return
  // When tab becomes visible, recalculate from target time
  if (timerStatus.value === 'running' && timerMode.value === MODES.COUNTDOWN) {
    cdRemaining.value = Math.max(0, Math.ceil((cdTarget.value - Date.now()) / 1000))
  }
}

// ============================================================
// Computed
// ============================================================
const displayTime = computed(() => {
  if (agendaRun.value.active && agendaRun.value.items[agendaRun.value.index]) {
    return formatTime(agendaRun.value.items[agendaRun.value.index].remaining)
  }
  if (timerMode.value === MODES.COUNTDOWN) return formatTime(cdRemaining.value)
  if (timerMode.value === MODES.COUNTUP) return formatTime(cuElapsed.value)
  return formatClock(clockNow.value)
})

const displayLabel = computed(() => {
  if (agendaRun.value.active && agendaRun.value.items[agendaRun.value.index]) {
    return agendaRun.value.items[agendaRun.value.index].name
  }
  if (timerMode.value === MODES.COUNTDOWN) return '倒计时'
  if (timerMode.value === MODES.COUNTUP) return '正计时'
  return '时钟'
})

const timeStatus = computed(() => {
  // Agenda takes precedence
  if (agendaRun.value.active) {
    const item = agendaRun.value.items[agendaRun.value.index]
    if (!item) return 'normal'
    if (item.remaining <= dangerThreshold.value) return 'danger'
    if (item.remaining <= warningThreshold.value) return 'warning'
    return 'normal'
  }

  if (timerMode.value === MODES.COUNTDOWN) {
    if (timerStatus.value === 'finished' || cdRemaining.value <= 0) return 'danger'
    if (cdRemaining.value <= dangerThreshold.value) return 'danger'
    if (cdRemaining.value <= warningThreshold.value) return 'warning'
  }
  return 'normal'
})

const progressPercent = computed(() => {
  if (agendaRun.value.active) {
    const item = agendaRun.value.items[agendaRun.value.index]
    if (!item || item.total <= 0) return 0
    return ((item.total - item.remaining) / item.total) * 100
  }
  if (timerMode.value !== MODES.COUNTDOWN) return 0
  if (!Number.isFinite(cdTotal.value) || cdTotal.value <= 0) return 0
  const pct = ((cdTotal.value - cdRemaining.value) / cdTotal.value) * 100
  return Math.max(0, Math.min(100, pct))
})

const canStart = computed(() => {
  if (timerMode.value === MODES.CLOCK) return false
  if (timerMode.value === MODES.COUNTDOWN && cdRemaining.value <= 0) return false
  return timerStatus.value === 'idle' || timerStatus.value === 'paused'
})

const clockDisplay = computed(() => formatClock(new Date()))

// ============================================================
// Lifecycle
// ============================================================
onMounted(() => {
  clockInterval = setInterval(() => { clockNow.value = new Date() }, 1000)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
  document.addEventListener('visibilitychange', onVisibilityChange)

  // URL params
  const params = new URLSearchParams(window.location.search)
  if (params.get('auto') === '1') {
    const t = parseInt(params.get('time'), 10)
    if (!isNaN(t) && t > 0 && t <= MAX_DURATION) {
      setPreset(t)
      startTimer()
    }
  }
})

onUnmounted(() => {
  stopEngine()
  if (clockInterval) clearInterval(clockInterval)
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <div class="tool-page" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- Toolbar -->
    <div class="timer-toolbar">
      <h1>⏱️ 专业计时器</h1>
      <div class="toolbar-actions">
        <button
          class="btn btn-sm"
          :class="soundEnabled ? 'btn-secondary' : ''"
          @click="soundEnabled = !soundEnabled"
          :title="soundEnabled ? '声音已开启' : '声音已关闭'"
        >
          {{ soundEnabled ? '🔊' : '🔇' }}
        </button>
        <button class="btn btn-sm btn-secondary" @click="toggleFullscreen">
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </button>
      </div>
    </div>

    <!-- Mode Switcher -->
    <div class="mode-tabs">
      <button
        v-for="(label, key) in { [MODES.COUNTDOWN]: '倒计时', [MODES.COUNTUP]: '正计时', [MODES.CLOCK]: '时钟' }"
        :key="key"
        class="mode-btn"
        :class="{ active: timerMode === key && !agendaRun.active }"
        @click="switchMode(key)"
      >
        {{ label }}
      </button>
    </div>

    <!-- Main Display -->
    <div class="timer-display-card" :class="`status-${timeStatus}`" :style="timeStatus === 'danger' ? { borderColor: stageDangerColor, boxShadow: `0 0 24px ${stageDangerColor}40` } : timeStatus === 'warning' ? { borderColor: stageWarningColor } : {}">
      <!-- Overlay Message -->
      <div v-if="overlayMessage" class="overlay-message">
        {{ overlayMessage }}
      </div>

      <!-- Label -->
      <div class="timer-label">{{ displayLabel }}</div>

      <!-- Time -->
      <div class="timer-main" :class="{ fullscreen: isFullscreen }">
        {{ displayTime }}
      </div>

      <!-- Progress ring -->
      <div v-if="timerMode === MODES.COUNTDOWN || agendaRun.active" class="progress-ring">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="80" fill="none" stroke="var(--bg-tertiary)" stroke-width="6" />
          <circle
            cx="90" cy="90" r="80" fill="none"
            :stroke="timeStatus === 'danger' ? stageDangerColor : timeStatus === 'warning' ? stageWarningColor : stageNormalColor"
            stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="2 * Math.PI * 80"
            :stroke-dashoffset="2 * Math.PI * 80 * (1 - progressPercent / 100)"
            transform="rotate(-90 90 90)"
            style="transition: stroke-dashoffset 1s linear"
          />
        </svg>
      </div>

      <!-- Status badge -->
      <div v-if="timerStatus === 'finished'" class="status-badge finished">时间到</div>
      <div v-else-if="agendaRun.active && agendaRun.items[agendaRun.index]" class="status-badge running">
        环节 {{ agendaRun.index + 1 }} / {{ agendaRun.items.length }}
      </div>

      <!-- Controls -->
      <div v-if="timerMode !== MODES.CLOCK" class="timer-main-controls">
        <button v-if="canStart" class="btn btn-lg" @click="startTimer">开始</button>
        <button v-else-if="timerStatus === 'running'" class="btn btn-lg btn-secondary" @click="pauseTimer">暂停</button>
        <button v-else-if="timerStatus === 'finished'" class="btn btn-lg btn-secondary" @click="resetTimer">已完成</button>
        <button class="btn btn-secondary" @click="resetTimer" :disabled="timerStatus === 'idle'">重置</button>
      </div>

      <!-- Quick adjust -->
      <div v-if="timerMode !== MODES.CLOCK" class="quick-adjust">
        <button class="btn btn-sm btn-secondary" @click="adjustTimer(-60)">-1分</button>
        <button class="btn btn-sm btn-secondary" @click="adjustTimer(-10)">-10秒</button>
        <button class="btn btn-sm btn-secondary" @click="adjustTimer(10)">+10秒</button>
        <button class="btn btn-sm btn-secondary" @click="adjustTimer(60)">+1分</button>
      </div>

      <!-- Clock combo display -->
      <div class="clock-combo">
        <span class="clock-icon">🕐</span>
        <span>{{ clockDisplay }}</span>
      </div>
    </div>

    <!-- Countdown Presets -->
    <div v-if="timerMode === MODES.COUNTDOWN && !agendaRun.active" class="timer-section card">
      <h3>快速预设</h3>
      <div class="preset-grid">
        <button
          v-for="p in PRESETS"
          :key="p.seconds"
          class="preset-btn"
          :class="{ active: cdTotal === p.seconds && cdRemaining === p.seconds && timerStatus === 'idle' }"
          @click="setPreset(p.seconds)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="custom-time-input">
        <label>自定义时长（时:分:秒 或 秒数）</label>
        <input
          type="text"
          placeholder="00:05:00"
          @change="onCustomTimeInput"
        />
      </div>
    </div>

    <!-- Agenda -->
    <div class="timer-section card">
      <div class="agenda-header">
        <h3>节目单</h3>
        <div class="agenda-actions">
          <button v-if="!agendaRun.active" class="btn btn-sm" @click="startAgenda" :disabled="agendaItems.length === 0">
            开始串联
          </button>
          <template v-else>
            <button class="btn btn-sm btn-secondary" @click="prevAgendaItem">上一个</button>
            <button class="btn btn-sm btn-secondary" @click="skipAgendaItem">跳过</button>
            <button class="btn btn-sm btn-secondary" @click="nextAgendaItem">下一个</button>
            <button class="btn btn-sm btn-danger" @click="stopAgenda">停止</button>
          </template>
        </div>
      </div>

      <!-- Agenda runtime display -->
      <div v-if="agendaRun.active && agendaRun.items.length" class="agenda-runtime">
        <div
          v-for="(item, idx) in agendaRun.items"
          :key="idx"
          class="agenda-runtime-item"
          :class="{ active: idx === agendaRun.index, completed: item.status === 'completed', skipped: item.status === 'skipped' }"
        >
          <span class="agenda-runtime-name">{{ item.name }}</span>
          <span class="agenda-runtime-time">{{ formatTime(item.remaining) }} / {{ formatTime(item.total) }}</span>
        </div>
      </div>

      <!-- Agenda editor -->
      <div class="agenda-list">
        <div
          v-for="(item, idx) in agendaItems"
          :key="idx"
          class="agenda-item"
        >
          <div class="agenda-num">{{ idx + 1 }}</div>
          <input v-model="item.name" class="agenda-name" placeholder="环节名称" :disabled="agendaRun.active" />
          <input
            v-model.number="item.duration"
            type="number"
            class="agenda-duration"
            min="1"
            :max="MAX_DURATION"
            :disabled="agendaRun.active"
          />
          <span class="agenda-unit">秒</span>
          <button class="btn btn-sm btn-secondary" @click="moveAgendaItem(idx, -1)" :disabled="idx === 0 || agendaRun.active">↑</button>
          <button class="btn btn-sm btn-secondary" @click="moveAgendaItem(idx, 1)" :disabled="idx === agendaItems.length - 1 || agendaRun.active">↓</button>
          <button class="btn btn-sm btn-danger" @click="removeAgendaItem(idx)" :disabled="agendaRun.active">删除</button>
        </div>
        <button class="btn btn-sm btn-secondary" @click="addAgendaItem" style="margin-top: 8px" :disabled="agendaRun.active">
          + 添加环节
        </button>
      </div>

      <!-- Templates -->
      <div class="template-section">
        <h4>预置模板</h4>
        <div class="template-grid">
          <button
            v-for="tpl in TEMPLATES"
            :key="tpl.name"
            class="template-btn"
            @click="loadTemplate(tpl)"
            :disabled="agendaRun.active"
          >
            {{ tpl.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Overlay Message Control -->
    <div class="timer-section card">
      <h3>消息叠加</h3>
      <div class="overlay-controls">
        <input v-model="overlayInput" placeholder="输入要在计时画面上显示的消息..." @keyup.enter="setOverlay" />
        <button class="btn" @click="setOverlay">显示</button>
        <button class="btn btn-secondary" @click="clearOverlay">清除</button>
      </div>
      <div v-if="overlayMessage" class="overlay-preview">
        当前消息：{{ overlayMessage }}
      </div>
    </div>

    <!-- Settings -->
    <div class="timer-section card">
      <h3>设置</h3>
      <div class="settings-grid">
        <div class="setting-row">
          <label>警告阈值（秒）</label>
          <input v-model.number="warningThreshold" type="number" min="1" :max="MAX_DURATION" />
        </div>
        <div class="setting-row">
          <label>危险阈值（秒）</label>
          <input v-model.number="dangerThreshold" type="number" min="1" :max="MAX_DURATION" />
        </div>
        <div class="setting-row">
          <label>正常阶段颜色</label>
          <input v-model="stageNormalColor" type="color" style="width:40px;height:28px;border:none;cursor:pointer" />
        </div>
        <div class="setting-row">
          <label>警告阶段颜色</label>
          <input v-model="stageWarningColor" type="color" style="width:40px;height:28px;border:none;cursor:pointer" />
        </div>
        <div class="setting-row">
          <label>危险阶段颜色</label>
          <input v-model="stageDangerColor" type="color" style="width:40px;height:28px;border:none;cursor:pointer" />
        </div>
        <div class="setting-row">
          <label>提示音量</label>
          <input v-model.number="soundVolume" type="range" min="0" max="1" step="0.1" />
          <span>{{ Math.round(soundVolume * 100) }}%</span>
        </div>
        <div class="setting-row">
          <label>时钟格式</label>
          <select v-model="use24Hour">
            <option :value="true">24 小时制</option>
            <option :value="false">12 小时制</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Usage Log -->
    <div class="timer-section card">
      <div class="log-header">
        <h3>使用记录</h3>
        <div class="log-actions">
          <button class="btn btn-sm btn-secondary" @click="exportLogAsCsv" :disabled="!usageLog.length">导出 CSV</button>
          <button class="btn btn-sm btn-secondary" @click="exportLogAsPdf" :disabled="!usageLog.length">导出 PDF</button>
          <button class="btn btn-sm btn-danger" @click="clearLog" :disabled="!usageLog.length">清空</button>
        </div>
      </div>
      <div v-if="!usageLog.length" class="log-empty">暂无记录</div>
      <div v-else class="log-list">
        <div v-for="(entry, idx) in usageLog.slice(0, 20)" :key="idx" class="log-entry">
          <span class="log-time">{{ new Date(entry.time).toLocaleTimeString() }}</span>
          <span class="log-type">{{ entry.type }}</span>
          <span v-if="entry.detail" class="log-detail">{{ entry.detail }}</span>
        </div>
        <div v-if="usageLog.length > 20" class="log-more">还有 {{ usageLog.length - 20 }} 条记录...</div>
      </div>
    </div>

    <!-- Shortcuts -->
    <div class="timer-section card shortcuts-card">
      <h3>快捷键</h3>
      <div class="shortcuts-grid">
        <div class="shortcut"><kbd>Space</kbd><span>开始 / 暂停</span></div>
        <div class="shortcut"><kbd>R</kbd><span>重置</span></div>
        <div class="shortcut"><kbd>F</kbd><span>全屏切换</span></div>
        <div class="shortcut"><kbd>S</kbd><span>跳过当前环节</span></div>
        <div class="shortcut"><kbd>↑ ↓</kbd><span>增减 1 分钟</span></div>
        <div class="shortcut"><kbd>← →</kbd><span>切换节目单环节</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Toolbar */
.timer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}
.timer-toolbar h1 {
  margin: 0;
}
.toolbar-actions {
  display: flex;
  gap: 8px;
}

/* Mode tabs */
.mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.mode-btn {
  padding: 8px 20px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.mode-btn:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}
.mode-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

/* Display card */
.timer-display-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 20px;
  position: relative;
  transition: border-color 0.3s, box-shadow 0.3s, background-color 0.3s;
}
.timer-display-card.status-warning {
  border-color: #f59e0b;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
}
.timer-display-card.status-danger {
  border-color: #ef4444;
  animation: dangerPulse 1s ease-in-out infinite alternate;
}
.fullscreen-mode .timer-display-card.status-danger {
  background: rgba(239, 68, 68, 0.15);
}
@keyframes dangerPulse {
  from { box-shadow: 0 0 20px rgba(239, 68, 68, 0.2); }
  to   { box-shadow: 0 0 50px rgba(239, 68, 68, 0.6); }
}

.overlay-message {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(59, 130, 246, 0.9);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 1;
}

.timer-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.timer-main {
  font-size: 72px;
  font-weight: 700;
  font-family: 'Menlo', 'Monaco', 'SF Mono', monospace;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 20px;
}
.timer-main.fullscreen {
  font-size: 20vw;
}

.progress-ring {
  position: absolute;
  top: 20px;
  right: 20px;
  opacity: 0.5;
}

.status-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 16px;
}
.status-badge.finished {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
.status-badge.running {
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent);
}

.timer-main-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 16px;
}

.quick-adjust {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.clock-combo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-muted);
  padding: 6px 14px;
  background: var(--bg-tertiary);
  border-radius: 20px;
}
.clock-icon {
  font-size: 12px;
}

/* Sections */
.timer-section {
  margin-bottom: 20px;
  padding: 24px;
}
.timer-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: var(--text-primary);
}

/* Presets */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.preset-btn {
  padding: 10px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.preset-btn:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}
.preset-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.custom-time-input label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.custom-time-input input {
  width: 100%;
  max-width: 200px;
  padding: 8px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
}

/* Agenda */
.agenda-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
}
.agenda-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.agenda-runtime {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
}
.agenda-runtime-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}
.agenda-runtime-item.active {
  background: rgba(59, 130, 246, 0.15);
  border-left: 3px solid var(--accent);
}
.agenda-runtime-item.completed {
  opacity: 0.5;
  text-decoration: line-through;
}
.agenda-runtime-item.skipped {
  opacity: 0.4;
  font-style: italic;
}
.agenda-runtime-name {
  color: var(--text-primary);
  font-weight: 500;
}
.agenda-runtime-time {
  color: var(--text-secondary);
  font-family: monospace;
  font-size: 13px;
}

.agenda-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.agenda-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: var(--radius);
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  transition: all 0.2s;
  flex-wrap: wrap;
}
.agenda-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.agenda-name {
  flex: 1;
  min-width: 100px;
  padding: 6px 10px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
}
.agenda-duration {
  width: 70px;
  padding: 6px 10px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  text-align: center;
}
.agenda-unit {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.template-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.template-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: var(--text-secondary);
}
.template-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.template-btn {
  padding: 8px 14px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.template-btn:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

/* Overlay */
.overlay-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.overlay-controls input {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
}
.overlay-preview {
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--text-secondary);
}

/* Settings */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.setting-row label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.setting-row input,
.setting-row select {
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
}
.setting-row span {
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: 4px;
}

/* Log */
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
}
.log-actions {
  display: flex;
  gap: 6px;
}
.log-empty {
  color: var(--text-muted);
  font-size: 14px;
  padding: 12px 0;
}
.log-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.log-entry {
  display: flex;
  gap: 12px;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--bg-tertiary);
}
.log-time {
  color: var(--text-muted);
  font-family: monospace;
  white-space: nowrap;
}
.log-type {
  color: var(--text-primary);
  font-weight: 500;
  min-width: 80px;
}
.log-detail {
  color: var(--text-secondary);
}
.log-more {
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 10px;
}

/* Shortcuts */
.shortcuts-card {
  margin-bottom: 40px;
}
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.shortcut {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary);
}
.shortcut kbd {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 8px;
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 12px;
  color: var(--text-primary);
  white-space: nowrap;
}

/* Buttons */
.btn-lg {
  padding: 12px 32px;
  font-size: 16px;
}
.btn-danger {
  background: #ef4444;
  color: white;
}
.btn-danger:hover {
  background: #dc2626;
}

/* Mobile */
@media (max-width: 768px) {
  .timer-main {
    font-size: 48px;
  }
  .progress-ring {
    display: none;
  }
  .agenda-item {
    flex-wrap: wrap;
  }
  .agenda-name {
    width: 100%;
  }
  .overlay-message {
    position: static;
    transform: none;
    margin-bottom: 12px;
    max-width: 100%;
  }
}
</style>
