<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { useToast } from '../../composables/useToast'
import { getUrlParams } from '../../utils/urlParams'
import { generateBatch } from '../../logic/random'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const type = useStorage('random-type', 'int')
const min = useStorage('random-min', 1)
const max = useStorage('random-max', 100)
const count = useStorage('random-count', 5)
const unique = useStorage('random-unique', false)
const length = useStorage('random-length', 8)
const prefix = useStorage('random-prefix', '')
const suffix = useStorage('random-suffix', '')

const results = ref([])
const error = ref('')
const toast = useToast()

const types = [
  { value: 'int', label: '整数' },
  { value: 'float', label: '小数' },
  { value: 'string', label: '字符串' },
  { value: 'uuid', label: 'UUID' },
  { value: 'color', label: '颜色' }
]

const showMinMax = computed(() => type.value === 'int' || type.value === 'float')
const showLength = computed(() => type.value === 'string')
const showUnique = computed(() => type.value === 'int' || type.value === 'float' || type.value === 'string')

function generate() {
  error.value = ''
  try {
    const opts = {
      min: Number(min.value),
      max: Number(max.value),
      count: Number(count.value),
      unique: unique.value,
      length: Number(length.value),
      prefix: prefix.value,
      suffix: suffix.value
    }
    results.value = generateBatch(type.value, opts)
  } catch (e) {
    error.value = e.message
    results.value = []
  }
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('type')) type.value = params.get('type')
  if (params.get('min')) min.value = Number(params.get('min'))
  if (params.get('max')) max.value = Number(params.get('max'))
  if (params.get('count')) count.value = Number(params.get('count'))
  if (params.get('unique')) unique.value = params.get('unique') === '1'
  if (params.get('length')) length.value = Number(params.get('length'))
  if (params.get('prefix')) prefix.value = params.get('prefix')
  if (params.get('suffix')) suffix.value = params.get('suffix')
  if (params.get('auto') === '1') generate()
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

function exportTxt() {
  if (!results.value.length) return
  const blob = new Blob([results.value.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `random-${type.value}.txt`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('已导出 TXT')
}

function clearAll() {
  results.value = []
  error.value = ''
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🎲 随机生成器</h1>
      <AiHelpPanel
        title="随机生成器"
        desc="生成随机整数、小数、字符串、UUID 和颜色"
        api-tool="random"
        :params="[
          { name: 'type', desc: '类型：int/float/string/uuid/color', required: false, example: 'int' },
          { name: 'min', desc: '最小值', required: false, example: '1' },
          { name: 'max', desc: '最大值', required: false, example: '100' },
          { name: 'count', desc: '生成数量', required: false, example: '5' },
          { name: 'unique', desc: '是否唯一（1 或 0）', required: false, example: '0' },
          { name: 'length', desc: '字符串长度', required: false, example: '8' },
          { name: 'prefix', desc: '前缀', required: false, example: '' },
          { name: 'suffix', desc: '后缀', required: false, example: '' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="tool-section">
      <div class="tool-panel card">
        <h3>配置</h3>
        <div class="config-row">
          <label>类型</label>
          <div class="type-tabs">
            <button
              v-for="t in types"
              :key="t.value"
              class="tab-btn"
              :class="{ active: type === t.value }"
              @click="type = t.value"
            >
              {{ t.label }}
            </button>
          </div>
        </div>
        <div v-if="showMinMax" class="config-row">
          <label>最小值</label>
          <input v-model.number="min" type="number" class="input">
        </div>
        <div v-if="showMinMax" class="config-row">
          <label>最大值</label>
          <input v-model.number="max" type="number" class="input">
        </div>
        <div v-if="showLength" class="config-row">
          <label>长度: {{ length }}</label>
          <input type="range" v-model.number="length" min="1" max="128" class="range-input">
        </div>
        <div class="config-row">
          <label>数量: {{ count }}</label>
          <input type="range" v-model.number="count" min="1" max="100" class="range-input">
        </div>
        <div v-if="showUnique" class="config-row">
          <label><input type="checkbox" v-model="unique"> 不重复</label>
        </div>
        <div class="config-row">
          <label>前缀</label>
          <input v-model="prefix" class="input" placeholder="可选前缀">
        </div>
        <div class="config-row">
          <label>后缀</label>
          <input v-model="suffix" class="input" placeholder="可选后缀">
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <div class="tool-actions" style="margin-top:16px">
          <button class="btn" @click="generate">生成</button>
          <button class="btn btn-secondary" @click="clearAll">清空</button>
        </div>
      </div>

      <div class="tool-panel">
        <div class="panel-label">
          <h3>结果 <span v-if="results.length" class="count-badge">({{ results.length }})</span></h3>
          <div class="tool-actions">
            <button class="btn btn-sm btn-secondary" @click="copyAll">复制全部</button>
            <button class="btn btn-sm btn-secondary" @click="exportTxt">导出 TXT</button>
          </div>
        </div>
        <div class="result-list">
          <div v-for="(item, i) in results" :key="i" class="result-item">
            <code class="result-text">{{ item }}</code>
            <button class="btn btn-sm btn-secondary" @click="copy(item)">复制</button>
          </div>
          <div v-if="!results.length" class="empty-state">
            点击"生成"按钮创建随机值
          </div>
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
.config-row {
  margin-bottom: 12px;
}
.config-row label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.config-row label input[type="checkbox"] {
  margin-right: 6px;
}
.range-input {
  width: 100%;
}
.type-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tab-btn {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.tab-btn:hover, .tab-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
.panel-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.count-badge {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: normal;
}
.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 4px;
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
.result-text {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
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
.error-msg {
  color: var(--error);
  font-size: 13px;
  margin-top: 4px;
}
</style>
