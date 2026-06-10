<script setup>
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

const length = useStorage('pwd-length', 16)
const count = useStorage('pwd-count', 5)
const useLower = useStorage('pwd-lower', true)
const useUpper = useStorage('pwd-upper', true)
const useNumber = useStorage('pwd-number', true)
const useSpecial = useStorage('pwd-special', false)
const excludeSimilar = useStorage('pwd-similar', false)
const ensureEach = useStorage('pwd-ensure', false)

const results = ref([])
const copyText = ref('')

const charsets = computed(() => {
  let sets = []
  if (useLower.value) sets.push('abcdefghijklmnopqrstuvwxyz')
  if (useUpper.value) sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  if (useNumber.value) sets.push('0123456789')
  if (useSpecial.value) sets.push('!@#$%^&*()_+-=[]{}|;:,.<>?')
  if (excludeSimilar.value) {
    sets = sets.map(s => s.replace(/[0O1lI]/g, ''))
  }
  return sets
})

const strength = computed(() => {
  let score = 0
  if (length.value >= 12) score += 2
  else if (length.value >= 8) score += 1
  score += charsets.value.length
  if (score >= 5) return { label: '强', color: 'var(--success)', width: '100%' }
  if (score >= 3) return { label: '中', color: 'var(--warning)', width: '60%' }
  return { label: '弱', color: 'var(--error)', width: '30%' }
})

function randomChar(pool) {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return pool[arr[0] % pool.length]
}

function generate() {
  const sets = charsets.value
  if (!sets.length) {
    results.value = []
    return
  }
  const pool = sets.join('')
  if (!pool.length) {
    results.value = []
    return
  }

  const res = []
  for (let c = 0; c < count.value; c++) {
    let pwd = ''
    if (ensureEach.value && length.value >= sets.length) {
      sets.forEach(s => { pwd += randomChar(s) })
    }
    while (pwd.length < length.value) {
      pwd += randomChar(pool)
    }
    // Shuffle
    const arr = pwd.split('')
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    res.push(arr.join(''))
  }
  results.value = res
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    copyText.value = '已复制'
    setTimeout(() => copyText.value = '', 2000)
  } catch {}
}

async function copyAll() {
  if (!results.value.length) return
  try {
    await navigator.clipboard.writeText(results.value.join('\n'))
    copyText.value = '全部已复制'
    setTimeout(() => copyText.value = '', 2000)
  } catch {}
}

function clearAll() {
  results.value = []
}
</script>

<template>
  <div class="tool-page">
    <h1>🔑 密码生成器</h1>
    <div class="tool-section">
      <div class="tool-panel card">
        <h3>配置</h3>
        <div class="config-row">
          <label>长度: {{ length }}</label>
          <input type="range" v-model.number="length" min="4" max="64" style="width:100%">
        </div>
        <div class="config-row">
          <label><input type="checkbox" v-model="useLower"> 小写字母 (a-z)</label>
        </div>
        <div class="config-row">
          <label><input type="checkbox" v-model="useUpper"> 大写字母 (A-Z)</label>
        </div>
        <div class="config-row">
          <label><input type="checkbox" v-model="useNumber"> 数字 (0-9)</label>
        </div>
        <div class="config-row">
          <label><input type="checkbox" v-model="useSpecial"> 特殊符号 (!@#$...)</label>
        </div>
        <div class="config-row">
          <label><input type="checkbox" v-model="excludeSimilar"> 排除易混淆字符 (0, O, 1, l, I)</label>
        </div>
        <div class="config-row">
          <label><input type="checkbox" v-model="ensureEach"> 确保每类至少一个</label>
        </div>
        <div class="config-row">
          <label>数量: {{ count }}</label>
          <input type="range" v-model.number="count" min="1" max="20" style="width:100%">
        </div>
        <div class="tool-actions" style="margin-top:16px">
          <button class="btn" @click="generate">生成</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
        </div>
      </div>
      <div class="tool-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>结果</h3>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:100px;height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden">
              <div :style="{ width: strength.width, height: '100%', background: strength.color, transition: 'all 0.3s' }"></div>
            </div>
            <span :style="{ color: strength.color, fontSize: '13px' }">{{ strength.label }}</span>
          </div>
        </div>
        <div class="result-list">
          <div v-for="(pwd, i) in results" :key="i" class="result-item">
            <code class="pwd-text">{{ pwd }}</code>
            <button class="btn btn-sm btn-secondary" @click="copy(pwd)">复制</button>
          </div>
          <div v-if="!results.length" style="color:var(--text-muted);padding:40px;text-align:center">
            点击"生成"按钮创建密码
          </div>
        </div>
        <button v-if="results.length" class="btn btn-sm btn-secondary" @click="copyAll" style="margin-top:8px">
          复制全部
        </button>
        <p v-if="copyText" style="color:var(--success);font-size:13px;margin-top:6px">{{ copyText }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-row {
  margin-bottom: 10px;
}
.config-row label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}
.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.pwd-text {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  word-break: break-all;
  background: none;
  color: var(--text-primary);
}
</style>
