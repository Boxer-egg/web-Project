<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getUrlParams } from '../../utils/urlParams'
import { useStorage } from '@vueuse/core'

const focusMinutes = useStorage('pomodoro-focus', 25)
const breakMinutes = useStorage('pomodoro-break', 5)
const isFocus = ref(true)
const isRunning = ref(false)
const timeLeft = ref(focusMinutes.value * 60)
let timer = null

const totalTime = computed(() => (isFocus.value ? focusMinutes.value : breakMinutes.value) * 60)
const progress = computed(() => ((totalTime.value - timeLeft.value) / totalTime.value) * 100)
const minutes = computed(() => Math.floor(timeLeft.value / 60))
const seconds = computed(() => String(timeLeft.value % 60).padStart(2, '0'))
const statusText = computed(() => isFocus.value ? '专注中' : '休息中')

const circumference = 2 * Math.PI * 120
const dashOffset = computed(() => circumference * (1 - progress.value / 100))

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch {}
}

function tick() {
  if (timeLeft.value > 0) {
    timeLeft.value--
  } else {
    playBeep()
    isFocus.value = !isFocus.value
    timeLeft.value = (isFocus.value ? focusMinutes.value : breakMinutes.value) * 60
  }
}

function start() {
  if (!isRunning.value) {
    isRunning.value = true
    timer = setInterval(tick, 1000)
  }
}

function pause() {
  isRunning.value = false
  if (timer) { clearInterval(timer); timer = null }
}

function reset() {
  pause()
  isFocus.value = true
  timeLeft.value = focusMinutes.value * 60
}

function skip() {
  pause()
  isFocus.value = !isFocus.value
  timeLeft.value = (isFocus.value ? focusMinutes.value : breakMinutes.value) * 60
}

function updateTime() {
  if (!isRunning.value) {
    timeLeft.value = (isFocus.value ? focusMinutes.value : breakMinutes.value) * 60
  }
}


onMounted(() => {
  const params = getUrlParams()
  if (params.get('focus')) {
    const f = parseInt(params.get('focus'), 10)
    if (!isNaN(f) && f > 0) focusMinutes.value = Math.min(f, 120)
  }
  if (params.get('break')) {
    const b = parseInt(params.get('break'), 10)
    if (!isNaN(b) && b > 0) breakMinutes.value = Math.min(b, 60)
  }
  timeLeft.value = focusMinutes.value * 60
  if (params.get('auto') === '1') start()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="tool-page">
    <h1>🍅 番茄钟</h1>
    <div class="pomodoro-container">
      <div class="timer-card card">
        <div class="status-badge" :class="isFocus ? 'focus' : 'break'">{{ statusText }}</div>
        <div class="timer-circle">
          <svg width="260" height="260" viewBox="0 0 260 260">
            <circle cx="130" cy="130" r="120" fill="none" stroke="var(--bg-tertiary)" stroke-width="8" />
            <circle
              cx="130" cy="130" r="120" fill="none"
              :stroke="isFocus ? 'var(--accent)' : 'var(--success)'"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              transform="rotate(-90 130 130)"
              style="transition: stroke-dashoffset 1s linear"
            />
          </svg>
          <div class="timer-text">
            <div class="timer-time">{{ minutes }}:{{ seconds }}</div>
          </div>
        </div>

        <div class="timer-controls">
          <button v-if="!isRunning" class="btn" @click="start">开始</button>
          <button v-else class="btn btn-secondary" @click="pause">暂停</button>
          <button class="btn btn-secondary" @click="reset">重置</button>
          <button class="btn btn-secondary" @click="skip">跳过</button>
        </div>
      </div>

      <div class="settings-card card">
        <h3>设置</h3>
        <div class="setting-row">
          <label>专注时长（分钟）</label>
          <input v-model.number="focusMinutes" type="range" min="1" max="60" style="width: 100%">
          <span>{{ focusMinutes }} 分钟</span>
        </div>
        <div class="setting-row">
          <label>休息时长（分钟）</label>
          <input v-model.number="breakMinutes" type="range" min="1" max="30" style="width: 100%">
          <span>{{ breakMinutes }} 分钟</span>
        </div>
        <button class="btn btn-sm btn-secondary" @click="updateTime" style="margin-top: 12px">应用设置</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pomodoro-container {
  max-width: 500px;
  margin: 0 auto;
}
.timer-card {
  padding: 32px;
  text-align: center;
  margin-bottom: 20px;
}
.status-badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
}
.status-badge.focus {
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent);
}
.status-badge.break {
  background: rgba(34, 197, 94, 0.15);
  color: var(--success);
}
.timer-circle {
  position: relative;
  width: 260px;
  height: 260px;
  margin: 0 auto 24px;
}
.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.timer-time {
  font-size: 56px;
  font-weight: 700;
  font-family: 'Menlo', 'Monaco', monospace;
  color: var(--text-primary);
}
.timer-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.settings-card {
  padding: 24px;
}
.setting-row {
  margin-bottom: 16px;
}
.setting-row label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.setting-row span {
  font-size: 13px;
  color: var(--text-primary);
}
</style>
