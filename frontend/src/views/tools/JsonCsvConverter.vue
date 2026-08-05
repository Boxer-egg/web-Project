<script setup>
import { ref, computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import * as jsonCsvLogic from '../../logic/json-csv'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const direction = useStorage('jsoncsv-direction', 'json-to-csv')
const delimiter = useStorage('jsoncsv-delimiter', ',')
const includeHeader = useStorage('jsoncsv-header', true)
const nestedMode = useStorage('jsoncsv-nested', 'serialize')
const preview = ref([])
const toast = useToast()

const {
  input,
  output,
  error,
  autoMode,
  copyText,
  clearAll: baseClear,
  loadExample,
  process: convert,
  copy
} = useTool({
  storageKey: 'jsoncsv',
  processor: (val) => {
    if (direction.value === 'json-to-csv') {
      const res = jsonCsvLogic.jsonToCsv(val, delimiter.value, includeHeader.value, nestedMode.value)
      try {
        const data = JSON.parse(val)
        preview.value = Array.isArray(data) ? data.slice(0, 5) : []
      } catch { preview.value = [] }
      return res
    } else {
      preview.value = []
      const mismatch = jsonCsvLogic.findColumnMismatch(val, delimiter.value)
      if (mismatch > 0) {
        error.value = `警告：第 ${mismatch} 行与表头的列数不一致，缺失值将补为空`
      } else {
        error.value = ''
      }
      return jsonCsvLogic.csvToJson(val, delimiter.value, includeHeader.value)
    }
  },
  paramMapping: {
    data: { ref: ref('') },
    direction: { ref: direction }
  },
  example: JSON.stringify([{ name: '张三', age: 28, city: '北京' }, { name: '李四', age: 32, city: '上海' }], null, 2)
})

watch([direction, delimiter, includeHeader, nestedMode], () => {
  if (autoMode.value) convert()
})

function handleLoadExample() {
  if (direction.value === 'json-to-csv') {
    input.value = JSON.stringify([
      { name: '张三', age: 28, city: '北京' },
      { name: '李四', age: 32, city: '上海' },
      { name: '王五', age: 25, city: '广州' }
    ], null, 2)
  } else {
    input.value = 'name,age,city\n张三,28,北京\n李四,32,上海\n王五,25,广州'
  }
  convert()
}

function exportFile() {
  if (!output.value) return
  const isCsv = direction.value === 'json-to-csv'
  const blob = new Blob([output.value], { type: isCsv ? 'text/csv' : 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = isCsv ? 'export.csv' : 'export.json'
  a.click()
  URL.revokeObjectURL(url)
  toast.success('已导出文件')
}

function clearAll() {
  baseClear()
  preview.value = []
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>📑 JSON ↔ CSV 转换</h1>
      <AiHelpPanel
        title="JSON ↔ CSV 转换"
        desc="JSON 数组与 CSV 格式互相转换，支持嵌套对象和自定义分隔符"
        api-tool="json_csv"
        :params="[
          { name: 'data', desc: '要转换的内容（JSON 或 CSV）', required: true, example: '[{&quot;a&quot;:1}]' },
          { name: 'direction', desc: '方向：json-to-csv 或 csv-to-json', required: false, example: 'json-to-csv' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="card config-bar">
      <div class="config-row">
        <label class="radio-label">
          <input type="radio" v-model="direction" value="json-to-csv" @change="handleLoadExample"> JSON → CSV
        </label>
        <label class="radio-label">
          <input type="radio" v-model="direction" value="csv-to-json" @change="handleLoadExample"> CSV → JSON
        </label>
        <select v-model="delimiter" class="input compact-select">
          <option value=",">逗号分隔</option>
          <option value=";">分号分隔</option>
          <option value="\t">Tab 分隔</option>
        </select>
        <select v-if="direction === 'json-to-csv'" v-model="nestedMode" class="input compact-select">
          <option value="serialize">嵌套对象：序列化为 JSON</option>
          <option value="flatten">嵌套对象：扁平化 (a.b)</option>
          <option value="ignore">嵌套对象：忽略</option>
        </select>
        <label class="checkbox-label">
          <input type="checkbox" v-model="includeHeader"> 包含表头
        </label>
      </div>
    </div>
    <div class="tool-actions">
      <button class="btn" @click="convert">转换</button>
      <button class="btn btn-secondary" @click="copy">复制结果</button>
      <button class="btn btn-secondary" @click="exportFile">导出文件</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="handleLoadExample">示例</button>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea v-model="input" class="textarea" :placeholder="direction === 'json-to-csv' ? '输入 JSON 数组...' : '输入 CSV 内容...'" rows="16"></textarea>
      </div>
      <div class="tool-panel">
        <h3>输出</h3>
        <textarea v-model="output" class="textarea" placeholder="转换结果..." rows="16" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self:flex-start">{{ copyText }}</button>
      </div>
    </div>
    <div v-if="preview.length && direction === 'json-to-csv'" class="card preview-table">
      <h3 class="table-title">表格预览（前 5 行）</h3>
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th v-for="key in Object.keys(preview[0])" :key="key">{{ key }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in preview" :key="i">
              <td v-for="key in Object.keys(preview[0])" :key="key">{{ row[key] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-if="error" class="error-msg">❌ {{ error }}</div>
  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.config-bar {
  margin-bottom: 16px;
  padding: 12px 16px;
}
.config-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.radio-label, .checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
}
.compact-select {
  width: auto;
  min-width: 120px;
}
.preview-table {
  margin-top: 16px;
  overflow: hidden;
}
.table-title {
  font-size: 14px;
  margin-bottom: 10px;
  color: var(--text-secondary);
}
.table-container {
  overflow-x: auto;
}
.table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}
.table th, .table td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}
.table th {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
}
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-top: 10px;
  font-size: 14px;
}
</style>
