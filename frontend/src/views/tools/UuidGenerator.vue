<script setup>
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import * as uuidLogic from '../../logic/uuid'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const count = useStorage('uuid-count', 10)
const format = useStorage('uuid-format', 'standard')
const prefix = useStorage('uuid-prefix', '')
const suffix = useStorage('uuid-suffix', '')
const results = ref([])
const toast = useToast()

const formats = [
  { value: 'standard', label: '标准格式' },
  { value: 'nohyphen', label: '无横线' },
  { value: 'uppercase', label: '大写' },
  { value: 'quoted', label: '带引号' },
  { value: 'array', label: '数组格式' },
]

const {
  process: generate
} = useTool({
  storageKey: 'uuid',
  processor: () => {
    const opts = {
      noHyphen: format.value === 'nohyphen',
      uppercase: format.value === 'uppercase',
      prefix: prefix.value,
      suffix: suffix.value,
      quote: format.value === 'quoted' ? "'" : ''
    }
    
    if (format.value === 'array') {
      const uuids = uuidLogic.generateBatch(count.value, { quote: "'" })
      results.value = [`[${uuids.join(', ')}]`]
    } else {
      results.value = uuidLogic.generateBatch(count.value, opts)
    }
    return ''
  },
  paramMapping: {
    count: { ref: count, transform: v => parseInt(v) },
    format: { ref: format },
    prefix: { ref: prefix },
    suffix: { ref: suffix }
  }
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
  const blob = new Blob([results.value.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'uuids.txt'
  a.click()
  URL.revokeObjectURL(url)
  toast.success('已导出 TXT')
}

function clearAll() {
  results.value = []
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🆔 UUID 生成器</h1>
      <AiHelpPanel
        title="UUID 生成器"
        desc="批量生成 UUID v4，支持多种输出格式"
        :params="[
          { name: 'count', desc: '生成数量 (1-100)', required: false, example: '10' },
          { name: 'format', desc: '输出格式：standard/nohyphen/uppercase/quoted/array', required: false, example: 'standard' },
          { name: 'prefix', desc: '前缀字符串', required: false, example: '' },
          { name: 'suffix', desc: '后缀字符串', required: false, example: '' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-section">
      <div class="tool-panel card">
        <h3>配置</h3>
        <div class="config-row">
          <label>数量: {{ count }}</label>
          <input type="range" v-model.number="count" min="1" max="100" class="range-input">
        </div>
        <div class="config-row">
          <label>格式</label>
          <select v-model="format" class="input">
            <option v-for="f in formats" :key="f.value" :value="f.value">{{ f.label }}</option>
          </select>
        </div>
        <div class="config-row">
          <label>前缀</label>
          <input v-model="prefix" class="input" placeholder="可选前缀">
        </div>
        <div class="config-row">
          <label>后缀</label>
          <input v-model="suffix" class="input" placeholder="可选后缀">
        </div>
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
          <div v-for="(uuid, i) in results" :key="i" class="result-item">
            <code class="uuid-text">{{ uuid }}</code>
            <button class="btn btn-sm btn-secondary" @click="copy(uuid)">复制</button>
          </div>
          <div v-if="!results.length" class="empty-state">
            点击"生成"按钮创建 UUID
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
.range-input {
  width: 100%;
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
.uuid-text {
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
</style>
