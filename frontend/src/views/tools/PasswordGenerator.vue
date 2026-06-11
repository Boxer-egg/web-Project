<script setup>
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import * as pwdLogic from '../../logic/password'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const length = useStorage('pwd-length', 16)
const count = useStorage('pwd-count', 5)
const useLower = useStorage('pwd-lower', true)
const useUpper = useStorage('pwd-upper', true)
const useNumber = useStorage('pwd-number', true)
const useSpecial = useStorage('pwd-special', false)
const excludeSimilar = useStorage('pwd-similar', false)
const ensureEach = useStorage('pwd-ensure', false)

const results = ref([])
const toast = useToast()

const {
  process: generate
} = useTool({
  storageKey: 'pwd',
  processor: () => {
    const res = []
    for (let i = 0; i < count.value; i++) {
      res.push(pwdLogic.generate({
        length: length.value,
        upper: useUpper.value,
        lower: useLower.value,
        numbers: useNumber.value,
        symbols: useSpecial.value,
        excludeSimilar: excludeSimilar.value
      }))
    }
    results.value = res
    return ''
  },
  paramMapping: {
    length: { ref: length, transform: v => parseInt(v) },
    count: { ref: count, transform: v => parseInt(v) },
    lower: { ref: useLower, transform: v => v !== '0' },
    upper: { ref: useUpper, transform: v => v !== '0' },
    number: { ref: useNumber, transform: v => v !== '0' },
    special: { ref: useSpecial, transform: v => v === '1' },
    similar: { ref: excludeSimilar, transform: v => v === '1' }
  }
})

const strength = computed(() => {
  let score = 0
  if (length.value >= 12) score += 2
  else if (length.value >= 8) score += 1
  if (useLower.value) score++
  if (useUpper.value) score++
  if (useNumber.value) score++
  if (useSpecial.value) score++
  
  if (score >= 5) return { label: '强', color: 'var(--success)', width: '100%' }
  if (score >= 3) return { label: '中', color: 'var(--warning)', width: '60%' }
  return { label: '弱', color: 'var(--error)', width: '30%' }
})

function copy(text) {
  navigator.clipboard.writeText(text)
  toast.success('已复制')
}

function copyAll() {
  if (!results.value.length) return
  navigator.clipboard.writeText(results.value.join('\n'))
  toast.success('全部已复制')
}

function clearAll() {
  results.value = []
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🔑 密码生成器</h1>
      <AiHelpPanel
        title="密码生成器"
        desc="使用加密安全随机数生成强密码，支持自定义长度和字符集"
        :params="[
          { name: 'length', desc: '密码长度（4-64）', required: false, example: '16' },
          { name: 'count', desc: '生成数量（1-20）', required: false, example: '5' },
          { name: 'lower', desc: '包含小写字母（1或0）', required: false, example: '1' },
          { name: 'upper', desc: '包含大写字母（1或0）', required: false, example: '1' },
          { name: 'number', desc: '包含数字（1或0）', required: false, example: '1' },
          { name: 'special', desc: '包含特殊符号（1或0）', required: false, example: '0' },
          { name: 'similar', desc: '排除易混淆字符（1或0）', required: false, example: '0' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-section">
      <div class="tool-panel card">
        <h3>配置</h3>
        <div class="config-row">
          <label>长度: {{ length }}</label>
          <input type="range" v-model.number="length" min="4" max="64" class="range-input">
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
          <label>数量: {{ count }}</label>
          <input type="range" v-model.number="count" min="1" max="20" class="range-input">
        </div>
        <div class="tool-actions" style="margin-top:16px">
          <button class="btn" @click="generate">生成</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
        </div>
      </div>
      <div class="tool-panel">
        <div class="panel-label">
          <h3>结果</h3>
          <div class="strength-meter">
            <div class="meter-bar">
              <div class="meter-fill" :style="{ width: strength.width, background: strength.color }"></div>
            </div>
            <span :style="{ color: strength.color }">{{ strength.label }}</span>
          </div>
        </div>
        <div class="result-list">
          <div v-for="(pwd, i) in results" :key="i" class="result-item">
            <code class="pwd-text">{{ pwd }}</code>
            <button class="btn btn-sm btn-secondary" @click="copy(pwd)">复制</button>
          </div>
          <div v-if="!results.length" class="empty-state">
            点击"生成"按钮创建密码
          </div>
        </div>
        <button v-if="results.length" class="btn btn-sm btn-secondary" @click="copyAll" style="margin-top:8px">
          复制全部
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.config-row {
  margin-bottom: 12px;
}
.config-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}
.range-input {
  width: 100%;
  margin-top: 4px;
}
.panel-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.strength-meter {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.meter-bar {
  width: 80px;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}
.meter-fill {
  height: 100%;
  transition: all 0.3s;
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
  color: var(--text-primary);
}
.empty-state {
  color: var(--text-muted);
  padding: 40px;
  text-align: center;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}
</style>
