<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const value = useStorage('css-value', 16)
const fromUnit = useStorage('css-from', 'px')
const toUnits = useStorage('css-to', ['rem', 'em', 'vh', 'vw'])
const rootFont = useStorage('css-root', 16)
const parentFont = useStorage('css-parent', 16)
const viewportW = useStorage('css-vw', 1920)
const viewportH = useStorage('css-vh', 1080)

const allUnits = [
  { key: 'px', label: 'PX', toPx: 1 },
  { key: 'rem', label: 'REM', toPx: null },
  { key: 'em', label: 'EM', toPx: null },
  { key: 'vh', label: 'VH', toPx: null },
  { key: 'vw', label: 'VW', toPx: null },
  { key: '%', label: '%', toPx: null },
  { key: 'pt', label: 'PT', toPx: 4 / 3 },
  { key: 'pc', label: 'PC', toPx: 16 },
  { key: 'in', label: 'IN', toPx: 96 },
  { key: 'cm', label: 'CM', toPx: 37.795 },
  { key: 'mm', label: 'MM', toPx: 3.7795 },
]

function getUrlParams() {
  // History mode: read from search
  return new URLSearchParams(window.location.search)
}

function toPx(val, unit) {
  const n = parseFloat(val)
  if (isNaN(n)) return NaN
  switch (unit) {
    case 'px': return n
    case 'rem': return n * rootFont.value
    case 'em': return n * parentFont.value
    case 'vh': return n * viewportH.value / 100
    case 'vw': return n * viewportW.value / 100
    case '%': return n * parentFont.value / 100
    case 'pt': return n * 4 / 3
    case 'pc': return n * 16
    case 'in': return n * 96
    case 'cm': return n * 37.795
    case 'mm': return n * 3.7795
    default: return n
  }
}

function fromPx(pxVal, unit) {
  switch (unit) {
    case 'px': return pxVal
    case 'rem': return pxVal / rootFont.value
    case 'em': return pxVal / parentFont.value
    case 'vh': return pxVal / viewportH.value * 100
    case 'vw': return pxVal / viewportW.value * 100
    case '%': return pxVal / parentFont.value * 100
    case 'pt': return pxVal * 3 / 4
    case 'pc': return pxVal / 16
    case 'in': return pxVal / 96
    case 'cm': return pxVal / 37.795
    case 'mm': return pxVal / 3.7795
    default: return pxVal
  }
}

const results = computed(() => {
  const px = toPx(value.value, fromUnit.value)
  if (isNaN(px)) return []
  return toUnits.value.map(u => {
    const converted = fromPx(px, u)
    const precision = converted < 0.01 ? 6 : converted < 1 ? 4 : 2
    return { unit: u, value: parseFloat(converted.toFixed(precision)) }
  })
})

function toggleUnit(unit) {
  const idx = toUnits.value.indexOf(unit)
  if (idx > -1) {
    if (toUnits.value.length > 1) toUnits.value.splice(idx, 1)
  } else {
    toUnits.value.push(unit)
  }
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text) } catch {}
}

function clearAll() {
  value.value = ''
}

function loadExample() {
  value.value = 16
  fromUnit.value = 'px'
  toUnits.value = ['rem', 'em', 'vh', 'vw']
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('value')) {
    value.value = parseFloat(params.get('value'))
    if (params.get('from')) fromUnit.value = params.get('from')
    if (params.get('to')) toUnits.value = params.get('to').split(',')
  } else if (!value.value) {
    loadExample()
  }
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>📐 CSS 单位转换</h1>
      <AiHelpPanel
        title="CSS 单位转换"
        desc="PX/REM/EM/VH/VW/百分比/PT/PC/IN/CM/MM 互转，支持自定义根字体和视口尺寸"
        :params="[
          { name: 'value', desc: '数值', required: true, example: '16' },
          { name: 'from', desc: '源单位：px/rem/em/vh/vw/%/pt/pc/in/cm/mm', required: false, example: 'px' },
          { name: 'to', desc: '目标单位，逗号分隔', required: false, example: 'rem,em' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <input v-model.number="value" type="number" class="input" placeholder="数值" style="flex:2">
          <select v-model="fromUnit" class="input" style="flex:1">
            <option v-for="u in allUnits" :key="u.key" :value="u.key">{{ u.label }}</option>
          </select>
        </div>
        <div class="card" style="padding:12px;margin-bottom:12px">
          <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">基础配置</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>
              <label style="font-size:12px;color:var(--text-muted)">根字体 (px)</label>
              <input v-model.number="rootFont" type="number" class="input" style="margin-top:2px">
            </div>
            <div>
              <label style="font-size:12px;color:var(--text-muted)">父字体 (px)</label>
              <input v-model.number="parentFont" type="number" class="input" style="margin-top:2px">
            </div>
            <div>
              <label style="font-size:12px;color:var(--text-muted)">视口宽 (px)</label>
              <input v-model.number="viewportW" type="number" class="input" style="margin-top:2px">
            </div>
            <div>
              <label style="font-size:12px;color:var(--text-muted)">视口高 (px)</label>
              <input v-model.number="viewportH" type="number" class="input" style="margin-top:2px">
            </div>
          </div>
        </div>
        <div style="margin-bottom:12px">
          <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">目标单位</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <label v-for="u in allUnits" :key="u.key" style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:13px">
              <input type="checkbox" :checked="toUnits.includes(u.key)" @change="toggleUnit(u.key)">
              {{ u.label }}
            </label>
          </div>
        </div>
        <div class="tool-actions">
          <button class="btn btn-secondary" @click="clearAll">清空</button>
          <button class="btn btn-secondary" @click="loadExample">示例</button>
        </div>
      </div>
      <div class="tool-panel">
        <h3>结果</h3>
        <div v-for="r in results" :key="r.unit" class="card" style="margin-bottom:8px;padding:10px 12px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <code style="font-size:14px">{{ value }}{{ fromUnit }} = {{ r.value }}{{ r.unit }}</code>
            <button class="btn btn-sm btn-secondary" @click="copy(`${r.value}${r.unit}`)">复制</button>
          </div>
        </div>
        <div v-if="!results.length" style="color:var(--text-muted);padding:40px;text-align:center">
          输入数值查看转换结果
        </div>
      </div>
    </div>
  </div>
</template>