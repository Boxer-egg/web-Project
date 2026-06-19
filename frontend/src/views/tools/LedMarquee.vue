<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { getUrlParams, applyParams } from '../../utils/urlParams'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

// ============================================================
// State
// ============================================================
const text = useStorage('led-text', '加油')
const speed = useStorage('led-speed', 5)
const textColor = useStorage('led-color', '#ff0000')
const bgColor = useStorage('led-bg', '#000000')
const fontSize = useStorage('led-size', 120)
const direction = useStorage('led-direction', 'left')

const isFullscreen = ref(false)
const fullscreenEl = ref(null)

// ============================================================
// Computed
// ============================================================
const duration = computed(() => {
  // speed 1-10 maps to duration 20s - 2s
  const s = Math.max(1, Math.min(10, Number(speed.value) || 5))
  return 22 - s * 2
})

const animName = computed(() => {
  const d = direction.value
  if (d === 'left') return 'scrollLeft'
  if (d === 'right') return 'scrollRight'
  if (d === 'up') return 'scrollUp'
  return 'scrollDown'
})

const isVertical = computed(() => direction.value === 'up' || direction.value === 'down')

// ============================================================
// Fullscreen
// ============================================================
function enterFullscreen() {
  if (!fullscreenEl.value) return
  fullscreenEl.value.requestFullscreen().catch(() => {})
}

function exitFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function onKeydown(e) {
  if (e.code === 'Escape' && isFullscreen.value) {
    exitFullscreen()
  }
}

// ============================================================
// Lifecycle
// ============================================================
onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  window.addEventListener('keydown', onKeydown)

  const params = getUrlParams()
  applyParams(params, {
    text: { ref: text, default: '加油' },
    speed: { ref: speed, transform: v => Math.max(1, Math.min(10, parseInt(v, 10) || 5)) },
    color: { ref: textColor, default: '#ff0000' },
    bg: { ref: bgColor, default: '#000000' },
    size: { ref: fontSize, transform: v => Math.max(12, Math.min(800, parseInt(v, 10) || 120)) },
    direction: { ref: direction, allowed: ['left', 'right', 'up', 'down'], default: 'left' },
  })
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>📱 手持 LED 弹幕</h1>
      <AiHelpPanel
        title="手持 LED 弹幕"
        desc="全屏滚动文字，模拟手机 LED 灯牌效果。支持自定义文字、颜色、速度、方向和字体大小。"
        api-tool="led_marquee"
        :params="[
          { name: 'text', desc: '滚动文字内容', required: false, example: '加油' },
          { name: 'speed', desc: '滚动速度 1-10', required: false, example: '5' },
          { name: 'color', desc: '文字颜色 HEX', required: false, example: '#ff0000' },
          { name: 'bg', desc: '背景颜色 HEX', required: false, example: '#000000' },
          { name: 'size', desc: '字体大小 px', required: false, example: '120' },
          { name: 'direction', desc: '滚动方向 left/right/up/down', required: false, example: 'left' },
        ]"
      />
    </div>

    <div class="tool-section">
      <div class="tool-panel card">
        <div class="input-group">
          <label>滚动文字</label>
          <input v-model="text" class="input" placeholder="输入文字..." maxlength="100" />
        </div>

        <div class="input-group">
          <label>滚动速度 ({{ speed }})</label>
          <input v-model.number="speed" type="range" min="1" max="10" step="1" class="input" />
        </div>

        <div class="input-row">
          <div class="input-group">
            <label>文字颜色</label>
            <div class="color-picker">
              <input v-model="textColor" type="color" class="color-input" />
              <input v-model="textColor" class="input" placeholder="#ff0000" />
            </div>
          </div>
          <div class="input-group">
            <label>背景颜色</label>
            <div class="color-picker">
              <input v-model="bgColor" type="color" class="color-input" />
              <input v-model="bgColor" class="input" placeholder="#000000" />
            </div>
          </div>
        </div>

        <div class="input-group">
          <label>字体大小 ({{ fontSize }}px)</label>
          <input v-model.number="fontSize" type="range" min="12" max="800" step="4" class="input" />
        </div>

        <div class="input-group">
          <label>滚动方向</label>
          <div class="direction-btns">
            <button
              v-for="d in ['left', 'right', 'up', 'down']"
              :key="d"
              class="btn btn-sm"
              :class="{ 'btn-secondary': direction !== d }"
              @click="direction = d"
            >
              {{ d === 'left' ? '← 向左' : d === 'right' ? '→ 向右' : d === 'up' ? '↑ 向上' : '↓ 向下' }}
            </button>
          </div>
        </div>

        <div class="tool-actions">
          <button class="btn" @click="enterFullscreen">全屏展示</button>
        </div>
      </div>

      <div class="tool-panel card preview-panel">
        <label>预览</label>
        <div
          class="led-preview"
          :style="{
            background: bgColor,
            color: textColor,
            fontSize: fontSize + 'px',
            flexDirection: isVertical ? 'column' : 'row',
            alignItems: isVertical ? 'flex-start' : 'center',
            justifyContent: isVertical ? 'center' : 'flex-start',
            overflow: 'hidden',
          }"
        >
          <div
            class="led-text"
            :style="{
              animationName: animName,
              animationDuration: duration + 's',
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              whiteSpace: isVertical ? 'normal' : 'nowrap',
              writingMode: isVertical ? 'horizontal-tb' : 'horizontal-tb',
            }"
          >
            {{ text || ' ' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Fullscreen overlay -->
    <div
      ref="fullscreenEl"
      class="led-fullscreen"
      :style="{
        background: bgColor,
        color: textColor,
        fontSize: fontSize + 'px',
        display: isFullscreen ? 'flex' : 'none',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: isVertical ? 'flex-start' : 'center',
        justifyContent: isVertical ? 'center' : 'flex-start',
      }"
      @click="exitFullscreen"
    >
      <div
        class="led-text"
        :style="{
          animationName: animName,
          animationDuration: duration + 's',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          whiteSpace: isVertical ? 'normal' : 'nowrap',
        }"
      >
        {{ text || ' ' }}
      </div>
      <button class="exit-btn" @click.stop="exitFullscreen">退出</button>
    </div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}
.tool-header h1 {
  margin: 0;
}

.tool-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 768px) {
  .tool-section {
    grid-template-columns: 1fr;
  }
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}
.input-group label {
  font-size: 13px;
  color: var(--text-secondary);
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.color-picker {
  display: flex;
  gap: 8px;
  align-items: center;
}
.color-input {
  width: 44px;
  height: 36px;
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.direction-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tool-actions {
  margin-top: 8px;
}

.preview-panel label {
  font-size: 13px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 8px;
}

.led-preview {
  height: 200px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  display: flex;
  position: relative;
}

.led-text {
  display: inline-block;
  padding: 0 20px;
  will-change: transform;
}

.led-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
  cursor: pointer;
}

.exit-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px 16px;
  border-radius: var(--radius);
  border: 1px solid rgba(255,255,255,0.3);
  background: rgba(0,0,0,0.4);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s;
}
.exit-btn:hover {
  background: rgba(0,0,0,0.7);
}

@keyframes scrollLeft {
  from { transform: translateX(100%); }
  to   { transform: translateX(-100%); }
}
@keyframes scrollRight {
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
}
@keyframes scrollUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(-100%); }
}
@keyframes scrollDown {
  from { transform: translateY(-100%); }
  to   { transform: translateY(100%); }
}
</style>
