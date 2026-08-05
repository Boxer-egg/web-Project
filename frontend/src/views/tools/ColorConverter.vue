<script setup>
import { ref, computed, watch } from 'vue'
import { getUrlParams } from '../../utils/urlParams'
import { useStorage } from '@vueuse/core'
import { useToast } from '../../composables/useToast'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const toast = useToast()

const hex = ref('#3B82F6')
const rgb = ref({ r: 59, g: 130, b: 246 })
const hsl = ref({ h: 217, s: 91, l: 60 })
const hexError = ref(false)
const copyText = ref('')
const recentColors = useStorage('color-recent', [])

function hexToRgb(h) {
  let s = h.replace(/^#/, '')
  if (s.length === 8) s = s.slice(0, 6) // strip alpha
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(s)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 }
  else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100
  let r, g, b
  if (s === 0) { r = g = b = l }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

function updateFromHex() {
  let h = hex.value.trim()
  if (h.startsWith('#')) h = h.slice(1)
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const valid = /^[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(h)
  if (!valid) {
    hexError.value = true
    return
  }
  hexError.value = false
  hex.value = '#' + h.toUpperCase().slice(0, 6)
  const r = hexToRgb(hex.value)
  if (r) {
    rgb.value = r
    hsl.value = rgbToHsl(r.r, r.g, r.b)
    saveRecent(hex.value)
  }
}

function updateFromRgb() {
  const r = Math.max(0, Math.min(255, Math.round(rgb.value.r || 0)))
  const g = Math.max(0, Math.min(255, Math.round(rgb.value.g || 0)))
  const b = Math.max(0, Math.min(255, Math.round(rgb.value.b || 0)))
  rgb.value = { r, g, b }
  hex.value = rgbToHex(r, g, b)
  hsl.value = rgbToHsl(r, g, b)
  hexError.value = false
  saveRecent(hex.value)
}

function updateFromHsl() {
  const h = Math.max(0, Math.min(360, Math.round(hsl.value.h || 0)))
  const s = Math.max(0, Math.min(100, Math.round(hsl.value.s || 0)))
  const l = Math.max(0, Math.min(100, Math.round(hsl.value.l || 0)))
  hsl.value = { h, s, l }
  const r = hslToRgb(h, s, l)
  rgb.value = r
  hex.value = rgbToHex(r.r, r.g, r.b)
  hexError.value = false
  saveRecent(hex.value)
}

function randomColor() {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  rgb.value = { r, g, b }
  hex.value = rgbToHex(r, g, b)
  hsl.value = rgbToHsl(r, g, b)
  hexError.value = false
  saveRecent(hex.value)
}

function saveRecent(color) {
  const arr = recentColors.value.filter(c => c !== color)
  arr.unshift(color)
  recentColors.value = arr.slice(0, 5)
}

function applyColor(color) {
  hex.value = color
  updateFromHex()
}

async function copy(type) {
  let text = ''
  if (type === 'hex') text = hex.value
  else if (type === 'rgb') text = `rgb(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b})`
  else if (type === 'hsl') text = `hsl(${hsl.value.h}, ${hsl.value.s}%, ${hsl.value.l}%)`
  try {
    await navigator.clipboard.writeText(text)
    copyText.value = type.toUpperCase() + ' 已复制'
    setTimeout(() => copyText.value = '', 2000)
  } catch {}
}

function clearAll() {
  hexError.value = false
  recentColors.value = []
  toast.success('已清空色板')
}

const variants = computed(() => {
  const defs = [
    { label: '更深', delta: -30 },
    { label: '更暗', delta: -20 },
    { label: '原色', delta: 0 },
    { label: '浅色', delta: 20 },
    { label: '更亮', delta: 30 }
  ]
  return defs.map(d => {
    const nl = Math.max(5, Math.min(95, hsl.value.l + d.delta))
    const r = hslToRgb(hsl.value.h, hsl.value.s, nl)
    return { hex: rgbToHex(r.r, r.g, r.b), label: d.label }
  })
})

watch(hex, updateFromHex, { immediate: true })
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>🎨 颜色转换器</h1>
      <AiHelpPanel
        title="颜色转换器"
        desc="HEX / RGB / HSL 互转，支持透明度 HEX、配色建议和最近色板"
        api-tool="color"
        :params="[
          { name: 'color', desc: '颜色 HEX 值', required: true, example: '#3B82F6' }
        ]"
      />
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <div class="preview" :style="{ background: hex }" title="点击复制 HEX" @click="copy('hex')"></div>
        <div class="tool-actions">
          <button class="btn btn-secondary" @click="randomColor">随机颜色</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
          <input type="color" :value="hex" @input="e => { hex = e.target.value; updateFromHex() }" style="width:50px;height:36px;border:none;cursor:pointer">
        </div>
        <div v-if="recentColors.length" class="recent-palette">
          <span style="font-size:12px;color:var(--text-muted)">最近颜色</span>
          <div class="palette-row">
            <div
              v-for="c in recentColors"
              :key="c"
              class="palette-swatch"
              :style="{ background: c }"
              :title="c"
              @click="applyColor(c)"
            ></div>
          </div>
        </div>
        <div class="variants">
          <div v-for="v in variants" :key="v.label" class="variant" :style="{ background: v.hex }" @click="applyColor(v.hex)">
            <span>{{ v.label }}</span>
          </div>
        </div>
      </div>
      <div class="tool-panel">
        <div class="input-group">
          <label>HEX</label>
          <div style="display:flex;gap:8px">
            <input v-model="hex" class="input" :class="{ invalid: hexError }" @blur="updateFromHex">
            <button class="btn btn-sm btn-secondary" @click="copy('hex')">复制</button>
          </div>
          <p v-if="hexError" class="invalid-msg">无效的 HEX 颜色</p>
        </div>
        <div class="input-group">
          <label>RGB</label>
          <div style="display:flex;gap:8px">
            <input v-model.number="rgb.r" type="number" min="0" max="255" class="input" @input="updateFromRgb">
            <input v-model.number="rgb.g" type="number" min="0" max="255" class="input" @input="updateFromRgb">
            <input v-model.number="rgb.b" type="number" min="0" max="255" class="input" @input="updateFromRgb">
            <button class="btn btn-sm btn-secondary" @click="copy('rgb')">复制</button>
          </div>
        </div>
        <div class="input-group">
          <label>HSL</label>
          <div style="display:flex;gap:8px">
            <input v-model.number="hsl.h" type="number" min="0" max="360" class="input" @input="updateFromHsl">
            <input v-model.number="hsl.s" type="number" min="0" max="100" class="input" @input="updateFromHsl">
            <input v-model.number="hsl.l" type="number" min="0" max="100" class="input" @input="updateFromHsl">
            <button class="btn btn-sm btn-secondary" @click="copy('hsl')">复制</button>
          </div>
        </div>
        <p v-if="copyText" style="color:var(--success);font-size:13px">{{ copyText }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview {
  height: 150px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  transition: background 0.3s;
  cursor: pointer;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.input-group label {
  font-size: 13px;
  color: var(--text-secondary);
}
.input.invalid {
  border-color: var(--error);
}
.invalid-msg {
  font-size: 12px;
  color: var(--error);
}
.variants {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.variant {
  flex: 1;
  height: 50px;
  border-radius: var(--radius);
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4px;
  border: 1px solid var(--border);
  transition: transform 0.2s;
}
.variant:hover {
  transform: scale(1.05);
}
.variant span {
  font-size: 11px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.recent-palette {
  margin-top: 12px;
}
.palette-row {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.palette-swatch {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: transform 0.2s;
}
.palette-swatch:hover {
  transform: scale(1.1);
}
</style>
