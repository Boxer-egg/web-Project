<script setup>
import { ref, computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { parseCron, getNextExecutions, generateCron, cronDialects } from '../../logic/cron'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const mode = useStorage('cron-mode', 'parse')
const dialect = useStorage('cron-dialect', 'unix')
const expr = useStorage('cron-expr', '30 8 * * *')
const freq = useStorage('cron-freq', 'day')
const interval = useStorage('cron-interval', 1)
const at = useStorage('cron-at', '08:30')

const error = ref('')
const description = ref('')
const nextList = ref([])

const generated = computed(() => {
  if (mode.value !== 'generate') return null
  return generateCron({ freq: freq.value, interval: interval.value, at: at.value })
})

function runParse() {
  error.value = ''
  description.value = ''
  nextList.value = []
  const result = parseCron(expr.value, dialect.value)
  if (!result.valid) {
    error.value = result.error
    return
  }
  description.value = result.description
  nextList.value = getNextExecutions(expr.value, dialect.value, 5)
}

function applyGenerated() {
  if (generated.value) {
    expr.value = generated.value.expr
    mode.value = 'parse'
    runParse()
  }
}

watch([mode, dialect, expr], () => {
  if (mode.value === 'parse') runParse()
}, { immediate: true })

watch([mode, freq, interval, at], () => {
  if (mode.value === 'generate' && generated.value) {
    expr.value = generated.value.expr
  }
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>⏰ Cron 表达式</h1>
      <AiHelpPanel
        title="Cron 表达式解析"
        desc="解析、生成和验证 Cron 表达式，支持 UNIX / Quartz / Spring 方言"
        api-tool="cron"
        :params="[
          { name: 'mode', desc: 'parse 或 generate', required: false, example: 'parse' },
          { name: 'expr', desc: 'Cron 表达式（parse 模式）', required: false, example: '30 8 * * *' },
          { name: 'dialect', desc: 'unix / quartz / spring', required: false, example: 'unix' },
          { name: 'freq', desc: 'second / minute / hour / day / week / month', required: false, example: 'day' },
          { name: 'interval', desc: '间隔值', required: false, example: '1' },
          { name: 'at', desc: '执行时间 HH:MM', required: false, example: '08:30' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-actions">
      <button class="btn" :class="mode === 'parse' ? '' : 'btn-secondary'" @click="mode = 'parse'">解析模式</button>
      <button class="btn" :class="mode === 'generate' ? '' : 'btn-secondary'" @click="mode = 'generate'">生成模式</button>
    </div>

    <div v-if="mode === 'parse'" class="card" style="margin-bottom:16px">
      <div class="form-row">
        <label>表达式：</label>
        <input v-model="expr" class="input" placeholder="30 8 * * *">
        <label>方言：</label>
        <select v-model="dialect" class="select">
          <option v-for="d in cronDialects" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <div v-if="description" class="result-text">描述：{{ description }}</div>
      <div v-if="error" class="error-text">错误：{{ error }}</div>
      <div v-if="nextList.length" class="next-list">
        <strong>最近执行时间：</strong>
        <ul>
          <li v-for="(t, i) in nextList" :key="i">{{ t }}</li>
        </ul>
      </div>
    </div>

    <div v-else class="card" style="margin-bottom:16px">
      <div class="form-row">
        <label>频率：</label>
        <select v-model="freq" class="select">
          <option value="second">每秒</option>
          <option value="minute">每分</option>
          <option value="hour">每小时</option>
          <option value="day">每天</option>
          <option value="week">每周</option>
          <option value="month">每月</option>
        </select>
        <label>间隔：</label>
        <input v-model.number="interval" type="number" class="input" min="1" style="width:80px">
        <label v-if="['day','week','month'].includes(freq)">时间：</label>
        <input v-if="['day','week','month'].includes(freq)" v-model="at" class="input" placeholder="08:30" style="width:100px">
      </div>
      <div class="result-text">生成结果：{{ generated.expr }}</div>
      <div class="result-text">描述：{{ generated.description }}</div>
      <button class="btn btn-sm" @click="applyGenerated">应用到解析模式</button>
    </div>
  </div>
</template>

<style scoped>
.form-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.form-row label {
  font-size: 13px;
  color: var(--text-secondary);
}
.input, .select {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
}
.result-text {
  margin: 8px 0;
  font-size: 14px;
  color: var(--text-primary);
}
.error-text {
  margin: 8px 0;
  font-size: 14px;
  color: var(--danger);
}
.next-list {
  margin-top: 12px;
  font-size: 13px;
}
.next-list ul {
  margin: 6px 0 0;
  padding-left: 20px;
}
</style>
