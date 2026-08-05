<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { getUrlParams } from '../../utils/urlParams'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const input = useStorage('num-input', '')
const fromBase = useStorage('num-from', 10)
const toBases = useStorage('num-to', [2, 8, 10, 16])
const results = ref([])

const autoMode = useStorage('num-auto', true)

watch([input, fromBase, toBases], () => {
  if (autoMode.value) convert()
}, { deep: true })

watch(autoMode, (v) => {
  if (v && input.value) convert()
})

const baseOptions = [
  { value: 2, label: '二进制 (2)' },
  { value: 8, label: '八进制 (8)' },
  { value: 10, label: '十进制 (10)' },
  { value: 16, label: '十六进制 (16)' },
  { value: 36, label: '三十六进制 (36)' },
  { value: 62, label: '六十二进制 (62)' },
]

const BASE_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// Convert a string in `fromBase` to decimal Number (supports negative & float)
function parseToNumber(numStr, base) {
  let s = numStr.trim()
  const neg = s.startsWith('-')
  if (neg || s.startsWith('+')) s = s.slice(1)

  if (base !== 10 && s.includes('.')) {
    throw new Error('非十进制不支持小数')
  }

  let intPart = s
  let fracPart = null
  if (s.includes('.')) {
    const parts = s.split('.')
    intPart = parts[0]
    fracPart = parts[1]
  }

  let value = 0
  for (const ch of intPart.toUpperCase()) {
    const d = BASE_CHARS.indexOf(ch)
    if (d < 0 || d >= base) throw new Error(`字符 "${ch}" 不是有效的 ${base} 进制数字`)
    value = value * base + d
  }

  if (fracPart !== null) {
    let f = 0
    let factor = 1 / base
    for (const ch of fracPart.toUpperCase()) {
      const d = BASE_CHARS.indexOf(ch)
      if (d < 0 || d >= base) throw new Error(`字符 "${ch}" 不是有效的 ${base} 进制数字`)
      f += d * factor
      factor /= base
    }
    value += f
  }

  return neg ? -value : value
}

// Convert decimal Number to a string in `targetBase`
function formatNumber(value, base) {
  if (!Number.isInteger(value)) {
    const intPart = Math.trunc(value)
    const frac = value - intPart
    let fracStr = ''
    if (base === 10) {
      fracStr = value.toString().includes('.') ? '.' + value.toString().split('.')[1] : ''
    } else {
      let f = Math.abs(frac)
      let out = ''
      let guard = 0
      while (f > 1e-10 && guard < 16) {
        f *= base
        const digit = Math.floor(f)
        out += BASE_CHARS[digit]
        f -= digit
        guard++
      }
      if (out) fracStr = '.' + out
    }
    return intToStr(intPart, base) + fracStr
  }
  return intToStr(value, base)
}

function intToStr(value, base) {
  if (value === 0) return '0'
  const neg = value < 0
  let v = Math.abs(value)
  let out = ''
  while (v > 0) {
    out = BASE_CHARS[v % base] + out
    v = Math.floor(v / base)
  }
  return (neg ? '-' : '') + out
}

// For negative integers, show two's complement in binary
function twosComplement(binaryStr) {
  // binaryStr without sign, compute -value complement
  let bits = binaryStr.replace(/^-/, '')
  const len = Math.max(8, Math.ceil(bits.length / 8) * 8)
  bits = bits.padStart(len, '0')
  let inverted = ''
  for (const ch of bits) inverted += ch === '0' ? '1' : '0'
  const arr = inverted.split('')
  let carry = 1
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === '1' && carry === 1) {
      arr[i] = '0'
    } else if (carry === 1) {
      arr[i] = '1'
      carry = 0
    }
  }
  return arr.join('')
}

// Group binary string into 4-bit groups with hex below
function binaryGrouping(binaryStr) {
  let s = binaryStr
  const neg = s.startsWith('-')
  if (neg) s = s.slice(1)
  s = s.padStart(Math.ceil(s.length / 4) * 4, '0')
  const groups = []
  for (let i = 0; i < s.length; i += 4) {
    const g = s.slice(i, i + 4)
    groups.push({ bits: g, hex: parseInt(g, 2).toString(16).toUpperCase() })
  }
  return { neg, groups }
}

function convert() {
  results.value = []
  if (!input.value.trim()) return

  let numStr = input.value.trim()
  // Full-width to half-width
  numStr = numStr.replace(/[\uff10-\uff19]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
  numStr = numStr.replace(/[\uff0d]/g, '-')
  numStr = numStr.replace(/[\uff0e]/g, '.')

  // Auto-detect prefix
  if (/^-?0x/i.test(numStr)) {
    fromBase.value = 16
    numStr = numStr.replace(/^-?0x/i, m => m.startsWith('-') ? '-' : '')
  } else if (/^-?0b/i.test(numStr)) {
    fromBase.value = 2
    numStr = numStr.replace(/^-?0b/i, m => m.startsWith('-') ? '-' : '')
  } else if (/^-?0o/i.test(numStr)) {
    fromBase.value = 8
    numStr = numStr.replace(/^-?0o/i, m => m.startsWith('-') ? '-' : '')
  }

  let decimal
  try {
    decimal = parseToNumber(numStr, fromBase.value)
  } catch (e) {
    results.value = [{ base: '错误', value: e.message }]
    return
  }

  if (!Number.isSafeInteger(decimal) && Number.isInteger(decimal)) {
    results.value.push({ base: '警告', value: '数字过大，结果可能不精确' })
  }
  if (numStr.includes('.') && fromBase.value === 10) {
    results.value.push({ base: '提示', value: '浮点转换可能存在精度误差' })
  }

  for (const base of toBases.value) {
    try {
      const converted = formatNumber(decimal, base)
      results.value.push({ base, label: baseOptions.find(b => b.value === base)?.label || `进制 (${base})`, value: converted })
    } catch {
      results.value.push({ base, label: `进制 (${base})`, value: '转换失败' })
    }
  }

  // Negative binary complement display
  if (decimal < 0 && Number.isInteger(decimal) && toBases.value.includes(2)) {
    const positiveBinary = formatNumber(Math.abs(decimal), 2)
    const comp = twosComplement(positiveBinary)
    const grouped = binaryGrouping(comp)
    const groupedHtml = grouped.groups.map(g => `<span style="font-weight:700">${g.bits}</span> (${g.hex})`).join(' ')
    results.value.push({
      base: '补码',
      label: '二进制补码',
      value: comp,
      html: groupedHtml
    })
  }

  // Binary grouping display when binary present
  const binResult = results.value.find(r => r.base === 2 && r.value && typeof r.value === 'string')
  if (binResult && !binResult.value.startsWith('-') && Number.isInteger(decimal) && decimal >= 0) {
    const grouped = binaryGrouping(binResult.value)
    binResult.groupedHtml = grouped.groups.map(g => `<span style="font-weight:700">${g.bits}</span> (${g.hex})`).join(' ')
  }
}

function toggleBase(base) {
  const idx = toBases.value.indexOf(base)
  if (idx > -1) {
    if (toBases.value.length > 1) toBases.value.splice(idx, 1)
    else alert('请至少选择一个目标进制')
  } else {
    toBases.value.push(base)
    toBases.value.sort((a, b) => a - b)
  }
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {}
}

async function copyAll() {
  const text = results.value.map(r => `${r.label}: ${r.value}`).join('\n')
  try {
    await navigator.clipboard.writeText(text)
  } catch {}
}

function clearAll() {
  input.value = ''
  results.value = []
}

function loadExample() {
  input.value = '255'
  fromBase.value = 10
  toBases.value = [2, 8, 16]
  convert()
}

function swap() {
  if (results.value.length > 0) {
    const firstBase = toBases.value[0]
    fromBase.value = firstBase
    convert()
  }
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('num')) {
    if (params.get('auto') === '1') autoMode.value = true
    else if (params.get('auto') === '0') autoMode.value = false
    input.value = params.get('num')
    if (params.get('from')) {
      const fb = parseInt(params.get('from'), 10)
      fromBase.value = isNaN(fb) ? 10 : fb
    }
    if (params.get('to')) {
      const tb = params.get('to').split(',').map(Number).filter(n => !isNaN(n) && n >= 2 && n <= 62)
      toBases.value = tb.length ? tb : [2, 8, 16]
    }
    nextTick(() => convert())
  } else if (!input.value) {
    loadExample()
  }
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>🔢 进制转换器</h1>
      <AiHelpPanel
        title="进制转换器"
        desc="在二/八/十/十六/三十六/六十二进制之间进行相互转换，支持整数、浮点、前缀自动识别和补码展示"
        :params="[
          { name: 'num', desc: '要转换的数字', required: true, example: '255' },
          { name: 'from', desc: '源进制：2/8/10/16/36/62', required: false, example: '10' },
          { name: 'to', desc: '目标进制，逗号分隔：2,8,16', required: false, example: '2,8,16' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <input v-model="input" class="input" placeholder="输入数字（支持 0x/0b/0o 前缀、负号、小数点）">
        <div style="margin-top:12px">
          <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">源进制</label>
          <select v-model="fromBase" class="input">
            <option v-for="b in baseOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
          </select>
        </div>
        <div style="margin-top:12px">
          <label style="font-size:13px;color:var(--text-secondary);display:block;margin-bottom:4px">目标进制</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <label v-for="b in baseOptions" :key="b.value" style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:13px">
              <input type="checkbox" :checked="toBases.includes(b.value)" @change="toggleBase(b.value)">
              {{ b.label }}
            </label>
          </div>
        </div>
        <div class="tool-actions" style="margin-top:16px">
          <button class="btn" @click="convert">转换</button>
          <button class="btn btn-secondary" @click="swap">交换</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
          <button class="btn btn-secondary" @click="loadExample">示例</button>
        </div>
        <div class="tool-actions" style="margin-top:8px">
          <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
            自动 {{ autoMode ? 'ON' : 'OFF' }}
          </button>
        </div>
      </div>
      <div class="tool-panel">
        <h3>结果</h3>
        <div v-for="r in results" :key="r.base" class="card" style="margin-bottom:8px;padding:10px 12px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:var(--text-secondary);font-weight:600">{{ r.label }}</span>
            <button v-if="r.base !== '错误' && r.base !== '警告' && r.base !== '提示' && r.base !== '补码'" class="btn btn-sm btn-secondary" @click="copy(r.value)">复制</button>
          </div>
          <code style="font-size:14px;word-break:break-all" v-if="!r.html">{{ r.value }}</code>
          <div class="bin-groups" v-else v-html="r.html"></div>
          <div v-if="r.groupedHtml" class="bin-groups" v-html="r.groupedHtml"></div>
        </div>
        <div v-if="!results.length" style="color:var(--text-muted);padding:40px;text-align:center">
          输入数字并点击转换
        </div>
        <button v-if="results.length" class="btn btn-sm btn-secondary" @click="copyAll">复制全部</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bin-groups {
  margin-top: 6px;
  font-size: 13px;
  font-family: monospace;
  word-break: break-all;
}
</style>
