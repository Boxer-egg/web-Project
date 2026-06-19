<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import { evaluate } from '../../logic/calculator'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const expr = useStorage('calc-expr', '')
const display = ref('0')
const history = ref([])
const toast = useToast()

const { process: computeExpr, output, error } = useTool({
  storageKey: 'calc',
  processor: (input) => {
    const res = evaluate(input)
    return String(res)
  },
  paramMapping: {
    expr: { ref: expr }
  },
  customInput: expr
})

function updateDisplay() {
  display.value = expr.value || '0'
}

function append(val) {
  if (display.value === '0' && val !== '.' && val !== '(') {
    expr.value = String(val)
  } else {
    expr.value += String(val)
  }
  updateDisplay()
}

function clearAll() {
  expr.value = ''
  display.value = '0'
  error.value = ''
}

function backspace() {
  expr.value = expr.value.slice(0, -1)
  updateDisplay()
}

function toggleSign() {
  if (!expr.value) return
  // Simple toggle: if starts with -, remove it; otherwise add -
  if (expr.value.startsWith('-')) {
    expr.value = expr.value.slice(1)
  } else {
    expr.value = '-' + expr.value
  }
  updateDisplay()
}

function compute() {
  if (!expr.value) return
  try {
    const res = evaluate(expr.value)
    const resultStr = String(res)
    history.value.unshift({ expr: expr.value, result: resultStr })
    if (history.value.length > 20) history.value.pop()
    expr.value = resultStr
    display.value = resultStr
    error.value = ''
  } catch (e) {
    error.value = e.message
  }
}

function useHistoryItem(item) {
  expr.value = item.result
  updateDisplay()
}

function copyResult() {
  if (!expr.value) return
  navigator.clipboard.writeText(expr.value)
  toast.success('已复制')
}

function onKeydown(e) {
  const key = e.key
  if (key >= '0' && key <= '9') {
    append(key)
  } else if (key === '.') {
    append('.')
  } else if (key === '+' || key === '-' || key === '*' || key === '/' || key === '%' || key === '^') {
    append(key)
  } else if (key === '(' || key === ')') {
    append(key)
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault()
    compute()
  } else if (key === 'Backspace') {
    backspace()
  } else if (key === 'Escape') {
    clearAll()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  updateDisplay()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🧮 计算器</h1>
      <AiHelpPanel
        title="计算器"
        desc="安全表达式计算器，支持 + - * / ^ % 和括号"
        api-tool="calculator"
        :params="[
          { name: 'expr', desc: '要计算的表达式', required: true, example: '1+2*3' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="tool-section">
      <div class="tool-panel card">
        <div class="calc-display">
          <div class="display-expr">{{ display }}</div>
          <div v-if="error" class="error-msg">{{ error }}</div>
        </div>
        <div class="calc-grid">
          <button class="calc-btn btn-secondary" @click="clearAll">C</button>
          <button class="calc-btn btn-secondary" @click="backspace">⌫</button>
          <button class="calc-btn btn-secondary" @click="toggleSign">±</button>
          <button class="calc-btn op" @click="append('/')">÷</button>

          <button class="calc-btn" @click="append('7')">7</button>
          <button class="calc-btn" @click="append('8')">8</button>
          <button class="calc-btn" @click="append('9')">9</button>
          <button class="calc-btn op" @click="append('*')">×</button>

          <button class="calc-btn" @click="append('4')">4</button>
          <button class="calc-btn" @click="append('5')">5</button>
          <button class="calc-btn" @click="append('6')">6</button>
          <button class="calc-btn op" @click="append('-')">−</button>

          <button class="calc-btn" @click="append('1')">1</button>
          <button class="calc-btn" @click="append('2')">2</button>
          <button class="calc-btn" @click="append('3')">3</button>
          <button class="calc-btn op" @click="append('+')">+</button>

          <button class="calc-btn" @click="append('0')">0</button>
          <button class="calc-btn" @click="append('.')">.</button>
          <button class="calc-btn" @click="append('(')">(</button>
          <button class="calc-btn op" @click="append(')')">)</button>

          <button class="calc-btn btn-secondary" @click="append('%')">%</button>
          <button class="calc-btn btn-secondary" @click="append('^')">^</button>
          <button class="calc-btn equals" @click="compute">=</button>
          <button class="calc-btn btn-secondary" @click="copyResult">复制</button>
        </div>
      </div>

      <div class="tool-panel">
        <div class="panel-label">
          <h3>历史记录</h3>
          <button v-if="history.length" class="btn btn-sm btn-secondary" @click="history = []">清空</button>
        </div>
        <div class="history-list">
          <div v-for="(item, i) in history" :key="i" class="history-item" @click="useHistoryItem(item)">
            <span class="history-expr">{{ item.expr }}</span>
            <span class="history-result">= {{ item.result }}</span>
          </div>
          <div v-if="!history.length" class="empty-state">暂无记录</div>
        </div>
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
.calc-display {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  margin-bottom: 12px;
  min-height: 64px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.display-expr {
  font-size: 22px;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  word-break: break-all;
  text-align: right;
  color: var(--text-primary);
}
.error-msg {
  color: var(--error);
  font-size: 12px;
  margin-top: 4px;
  text-align: right;
}
.calc-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.calc-btn {
  padding: 14px 0;
  font-size: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.calc-btn:hover {
  background: var(--bg-secondary);
}
.calc-btn.op {
  background: var(--bg-tertiary);
  color: var(--accent);
  font-weight: 600;
}
.calc-btn.equals {
  background: var(--accent);
  color: white;
  font-weight: 600;
}
.calc-btn.equals:hover {
  background: var(--accent-hover);
}
.panel-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 520px;
  overflow-y: auto;
}
.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}
.history-item:hover {
  border-color: var(--accent);
}
.history-expr {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  color: var(--text-secondary);
  word-break: break-all;
}
.history-result {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
  white-space: nowrap;
  margin-left: 8px;
}
.empty-state {
  color: var(--text-muted);
  padding: 40px;
  text-align: center;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}
@media (max-width: 768px) {
  .calc-btn {
    padding: 16px 0;
    font-size: 18px;
  }
}
</style>
