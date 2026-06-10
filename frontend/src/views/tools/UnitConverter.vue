<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'

const category = useStorage('unit-category', 'length')
const fromUnit = useStorage('unit-from', 'm')
const toUnit = useStorage('unit-to', 'km')
const value = useStorage('unit-value', '1')

const categories = {
  length: {
    name: '长度',
    base: 'm',
    units: {
      m: { name: '米', factor: 1 },
      km: { name: '千米', factor: 1000 },
      cm: { name: '厘米', factor: 0.01 },
      mm: { name: '毫米', factor: 0.001 },
      um: { name: '微米', factor: 1e-6 },
      nm: { name: '纳米', factor: 1e-9 },
      inch: { name: '英寸', factor: 0.0254 },
      ft: { name: '英尺', factor: 0.3048 },
      yd: { name: '码', factor: 0.9144 },
      mi: { name: '英里', factor: 1609.344 },
      nmi: { name: '海里', factor: 1852 },
      li: { name: '里', factor: 500 },
      zhang: { name: '丈', factor: 3.3333 },
      chi: { name: '尺', factor: 0.3333 },
      cun: { name: '寸', factor: 0.0333 },
    }
  },
  weight: {
    name: '重量',
    base: 'kg',
    units: {
      kg: { name: '千克', factor: 1 },
      g: { name: '克', factor: 0.001 },
      mg: { name: '毫克', factor: 1e-6 },
      t: { name: '吨', factor: 1000 },
      lb: { name: '磅', factor: 0.453592 },
      oz: { name: '盎司', factor: 0.0283495 },
      jin: { name: '市斤', factor: 0.5 },
      liang: { name: '两', factor: 0.05 },
    }
  },
  area: {
    name: '面积',
    base: 'm2',
    units: {
      m2: { name: '平方米', factor: 1 },
      km2: { name: '平方千米', factor: 1e6 },
      cm2: { name: '平方厘米', factor: 1e-4 },
      ha: { name: '公顷', factor: 10000 },
      mu: { name: '亩', factor: 666.667 },
      ft2: { name: '平方英尺', factor: 0.092903 },
      ac: { name: '英亩', factor: 4046.86 },
    }
  },
  volume: {
    name: '体积',
    base: 'l',
    units: {
      l: { name: '升', factor: 1 },
      ml: { name: '毫升', factor: 0.001 },
      m3: { name: '立方米', factor: 1000 },
      cm3: { name: '立方厘米', factor: 0.001 },
      gal_us: { name: '美制加仑', factor: 3.78541 },
      qt_us: { name: '美制夸脱', factor: 0.946353 },
      pt_us: { name: '美制品脱', factor: 0.473176 },
      floz_us: { name: '美制液盎司', factor: 0.0295735 },
    }
  },
  temperature: {
    name: '温度',
    units: {
      c: { name: '摄氏度' },
      f: { name: '华氏度' },
      k: { name: '开尔文' },
    }
  },
  data: {
    name: '数据存储',
    base: 'b',
    units: {
      b: { name: '字节 (B)', factor: 1 },
      kb: { name: 'KB', factor: 1024 },
      mb: { name: 'MB', factor: 1048576 },
      gb: { name: 'GB', factor: 1073741824 },
      tb: { name: 'TB', factor: 1099511627776 },
      pb: { name: 'PB', factor: 1125899906842624 },
      kib: { name: 'KiB', factor: 1024 },
      mib: { name: 'MiB', factor: 1048576 },
      gib: { name: 'GiB', factor: 1073741824 },
      tib: { name: 'TiB', factor: 1099511627776 },
    }
  },
}

const currentCategory = computed(() => categories[category.value])

const result = computed(() => {
  const v = parseFloat(value.value)
  if (isNaN(v)) return null
  const cat = currentCategory.value
  if (category.value === 'temperature') {
    return convertTemperature(v, fromUnit.value, toUnit.value)
  }
  const fromFactor = cat.units[fromUnit.value]?.factor ?? 1
  const toFactor = cat.units[toUnit.value]?.factor ?? 1
  const baseValue = v * fromFactor
  return baseValue / toFactor
})

function convertTemperature(v, from, to) {
  if (from === to) return v
  let celsius
  if (from === 'c') celsius = v
  else if (from === 'f') celsius = (v - 32) * 5 / 9
  else if (from === 'k') celsius = v - 273.15
  if (to === 'c') return celsius
  if (to === 'f') return celsius * 9 / 5 + 32
  if (to === 'k') return celsius + 273.15
  return celsius
}

const allResults = computed(() => {
  const v = parseFloat(value.value)
  if (isNaN(v)) return []
  const cat = currentCategory.value
  const results = []
  for (const [key, unit] of Object.entries(cat.units)) {
    if (key === fromUnit.value) continue
    let converted
    if (category.value === 'temperature') {
      converted = convertTemperature(v, fromUnit.value, key)
    } else {
      converted = (v * cat.units[fromUnit.value].factor) / unit.factor
    }
    results.push({ key, name: unit.name, value: formatNumber(converted) })
  }
  return results
})

function formatNumber(n) {
  if (Math.abs(n) < 0.0001 || Math.abs(n) > 1e9) return n.toExponential(4)
  return parseFloat(n.toPrecision(6)).toString()
}

watch(category, () => {
  const cat = currentCategory.value
  const keys = Object.keys(cat.units)
  fromUnit.value = keys[0]
  toUnit.value = keys[1] ?? keys[0]
})

function getUrlParams() {
  // History mode: read from search
  return new URLSearchParams(window.location.search)
}

function clearAll() {
  value.value = '1'
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('value')) value.value = params.get('value')
  if (params.get('category') && categories[params.get('category')]) category.value = params.get('category')
  if (params.get('from')) fromUnit.value = params.get('from')
  if (params.get('to')) toUnit.value = params.get('to')
})
</script>

<template>
  <div class="tool-page">
    <h1>📐 单位换算</h1>
    <div class="card" style="margin-bottom: 16px; padding: 12px 16px">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center">
        <label v-for="(cat, key) in categories" :key="key" style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 14px">
          <input type="radio" v-model="category" :value="key"> {{ cat.name }}
        </label>
      </div>
    </div>
    <div class="tool-section">
      <div class="tool-panel card">
        <h3>输入</h3>
        <input v-model="value" class="input" type="number" placeholder="输入数值">
        <label style="font-size: 13px; color: var(--text-secondary); display: block; margin: 12px 0 4px">从</label>
        <select v-model="fromUnit" class="input">
          <option v-for="(unit, key) in currentCategory.units" :key="key" :value="key">{{ unit.name }}</option>
        </select>
        <label style="font-size: 13px; color: var(--text-secondary); display: block; margin: 12px 0 4px">到</label>
        <select v-model="toUnit" class="input">
          <option v-for="(unit, key) in currentCategory.units" :key="key" :value="key">{{ unit.name }}</option>
        </select>
        <div class="tool-actions" style="margin-top: 16px">
          <button class="btn btn-secondary" @click="clearAll">重置</button>
        </div>
      </div>
      <div class="tool-panel">
        <h3>结果</h3>
        <div v-if="result !== null" class="result-highlight">
          {{ formatNumber(result) }} {{ currentCategory.units[toUnit]?.name }}
        </div>
        <div v-else style="color: var(--text-muted); padding: 20px">请输入有效数值</div>
        <h3 style="margin-top: 16px; font-size: 14px">全部换算</h3>
        <table class="result-table">
          <tbody>
            <tr v-for="item in allResults" :key="item.key">
              <td style="color: var(--text-secondary); font-size: 13px">{{ item.name }}</td>
              <td style="text-align: right; font-family: monospace; font-size: 13px">{{ item.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-highlight {
  font-size: 28px;
  font-weight: 600;
  color: var(--accent);
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  text-align: center;
}
.result-table {
  width: 100%;
  font-size: 14px;
  border-collapse: collapse;
}
.result-table td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
}
</style>
