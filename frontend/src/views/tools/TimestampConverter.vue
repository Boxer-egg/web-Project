<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'

const tsInput = useStorage('ts-input', '')
const dateInput = useStorage('ts-date', '')
const output = ref('')
const copyText = ref('复制')

function now() {
  const now = Date.now()
  tsInput.value = String(Math.floor(now / 1000))
  dateInput.value = formatLocal(new Date())
}

function formatLocal(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function tsToDate() {
  if (!tsInput.value) return
  const num = parseInt(tsInput.value)
  if (isNaN(num)) { output.value = '请输入有效的数字'; return }
  const ms = String(tsInput.value).length === 10 ? num * 1000 : num
  const d = new Date(ms)
  if (isNaN(d.getTime())) { output.value = '无效的时间戳'; return }
  output.value = `ISO: ${d.toISOString()}\n本地: ${formatDisplay(d)}\n友好: ${formatFriendly(d)}\n\n距离现在: ${relativeTime(d)}`
}

function dateToTs() {
  if (!dateInput.value) return
  const d = new Date(dateInput.value)
  if (isNaN(d.getTime())) { output.value = '无效的日期'; return }
  output.value = `秒级: ${Math.floor(d.getTime() / 1000)}\n毫秒级: ${d.getTime()}\n\nISO: ${d.toISOString()}`
}

function formatDisplay(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatFriendly(d) {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} 星期${days[d.getDay()]}`
}

function relativeTime(d) {
  const diff = d.getTime() - Date.now()
  const abs = Math.abs(diff)
  const s = Math.floor(abs / 1000)
  if (s < 60) return diff > 0 ? `${s} 秒后` : `${s} 秒前`
  const m = Math.floor(s / 60)
  if (m < 60) return diff > 0 ? `${m} 分钟后` : `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return diff > 0 ? `${h} 小时后` : `${h} 小时前`
  const days = Math.floor(h / 24)
  return diff > 0 ? `${days} 天后` : `${days} 天前`
}

async function copy() {
  if (!output.value) return
  try {
    await navigator.clipboard.writeText(output.value)
    copyText.value = '已复制'
    setTimeout(() => copyText.value = '复制', 2000)
  } catch {
    copyText.value = '复制失败'
  }
}

function clearAll() {
  tsInput.value = ''
  dateInput.value = ''
  output.value = ''
}

function loadExample() {
  tsInput.value = '1700000000'
  tsToDate()
}

function getUrlParams() {
  // History mode: read from search
  return new URLSearchParams(window.location.search)
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('ts')) {
    tsInput.value = params.get('ts')
    tsToDate()
  } else if (params.get('date')) {
    dateInput.value = params.get('date')
    dateToTs()
  } else if (!tsInput.value && !dateInput.value) {
    loadExample()
  } else if (tsInput.value) {
    tsToDate()
  } else if (dateInput.value) {
    dateToTs()
  }
})
</script>

<template>
  <div class="tool-page">
    <h1>⏰ 时间戳转换</h1>
    <div class="help-text card" style="margin-bottom:16px;font-size:13px;color:var(--text-secondary);line-height:1.8">
      <strong style="color:var(--text-primary)">使用说明：</strong><br>
      • <strong>时间戳 → 日期</strong>：在左侧输入框填入 Unix 时间戳（10位=秒，13位=毫秒），点击「转换」按钮<br>
      • <strong>日期 → 时间戳</strong>：在右侧点击日期选择器选择时间，点击「转换」按钮<br>
      • 点击「现在」按钮可快速填入当前时间<br>
      • 结果包含 ISO 格式、本地格式、友好格式，以及距离当前时间的相对时间
    </div>
    <div class="tool-section">
      <div class="tool-panel card">
        <h3>时间戳 → 日期</h3>
        <input v-model="tsInput" class="input" placeholder="输入 10/13 位时间戳">
        <div class="tool-actions">
          <button class="btn" @click="tsToDate">转换</button>
          <button class="btn btn-secondary" @click="now">现在</button>
        </div>
      </div>
      <div class="tool-panel card">
        <h3>日期 → 时间戳</h3>
        <input v-model="dateInput" class="input" type="datetime-local">
        <div class="tool-actions">
          <button class="btn" @click="dateToTs">转换</button>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h3 style="font-size:14px">结果</h3>
        <button class="btn btn-sm btn-secondary" @click="copy">{{ copyText }}</button>
      </div>
      <textarea v-model="output" class="textarea" placeholder="转换结果..." rows="8" readonly></textarea>
    </div>
    <div class="tool-actions" style="margin-top:10px">
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">加载示例</button>
    </div>
  </div>
</template>
