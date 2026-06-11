<script setup>
import { ref, onMounted } from 'vue'
import { getUrlParams } from '../../utils/urlParams'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const input = useStorage('jsoncsv-input', '')
const direction = useStorage('jsoncsv-direction', 'json-to-csv')
const delimiter = useStorage('jsoncsv-delimiter', ',')
const includeHeader = useStorage('jsoncsv-header', true)
const output = ref('')
const error = ref('')
const preview = ref([])

const aiParams = [
  { name: 'data', desc: '要转换的内容（JSON 或 CSV）', required: true, example: '[{"a":1}]' },
  { name: 'direction', desc: '方向：json-to-csv 或 csv-to-json', required: false, example: 'json-to-csv' },
  { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
]


function jsonToCsv() {
  error.value = ''
  preview.value = []
  if (!input.value.trim()) { output.value = ''; return }
  try {
    const data = JSON.parse(input.value)
    if (!Array.isArray(data)) {
      error.value = 'JSON 必须是数组格式，例如 [{"a":1}, {"a":2}]'
      return
    }
    if (data.length === 0) { output.value = ''; return }

    const keys = [...new Set(data.flatMap(obj => Object.keys(obj)))]
    const sep = delimiter.value
    let csv = ''

    if (includeHeader.value) {
      csv += keys.map(k => `"${String(k).replace(/"/g, '""')}"`).join(sep) + '\n'
    }

    for (const row of data) {
      const vals = keys.map(k => {
        const v = row[k]
        if (v === null || v === undefined) return ''
        if (typeof v === 'object') return `"${JSON.stringify(v).replace(/"/g, '""')}"`
        return `"${String(v).replace(/"/g, '""')}"`
      })
      csv += vals.join(sep) + '\n'
    }

    output.value = csv.trim()
    preview.value = data.slice(0, 5)
  } catch (e) {
    error.value = 'JSON 解析失败: ' + e.message
  }
}

function csvToJson() {
  error.value = ''
  preview.value = []
  if (!input.value.trim()) { output.value = '[]'; return }

  try {
    const lines = input.value.trim().split(/\r?\n/)
    if (lines.length === 0) { output.value = '[]'; return }

    const sep = delimiter.value
    const parseLine = (line) => {
      const result = []
      let inQuotes = false
      let current = ''
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === sep && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseLine(lines[0])
    const data = []
    const start = includeHeader.value ? 1 : 0
    const defaultHeaders = headers.map((_, i) => `col${i}`)

    for (let i = start; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      const vals = parseLine(lines[i])
      const obj = {}
      const h = includeHeader.value ? headers : defaultHeaders
      h.forEach((key, idx) => {
        obj[key] = vals[idx] || ''
      })
      data.push(obj)
    }

    output.value = JSON.stringify(data, null, 2)
  } catch (e) {
    error.value = 'CSV 解析失败: ' + e.message
    output.value = '[]'
  }
}

function convert() {
  if (direction.value === 'json-to-csv') jsonToCsv()
  else csvToJson()
}

async function copy() {
  if (!output.value) return
  try {
    await navigator.clipboard.writeText(output.value)
  } catch {}
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
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
  preview.value = []
}

function loadExample() {
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

onMounted(() => {
  const params = getUrlParams()
  if (params.get('data')) {
    input.value = params.get('data')
    if (params.get('direction')) direction.value = params.get('direction')
    convert()
  } else if (!input.value) {
    loadExample()
  }
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h1>📑 JSON ↔ CSV 转换</h1>
      <AiHelpPanel
        title="JSON ↔ CSV 转换"
        desc="JSON 数组与 CSV 格式互相转换，支持嵌套对象和自定义分隔符"
        :params="aiParams"
      />
    </div>
    <div class="card" style="margin-bottom:16px;padding:12px 16px">
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:14px">
          <input type="radio" v-model="direction" value="json-to-csv" @change="loadExample"> JSON → CSV
        </label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:14px">
          <input type="radio" v-model="direction" value="csv-to-json" @change="loadExample"> CSV → JSON
        </label>
        <select v-model="delimiter" class="input" style="width:auto">
          <option value=",">逗号分隔</option>
          <option value=";">分号分隔</option>
          <option value="\t">Tab 分隔</option>
        </select>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:14px">
          <input type="checkbox" v-model="includeHeader"> 包含表头
        </label>
      </div>
    </div>
    <div class="tool-actions">
      <button class="btn" @click="convert">转换</button>
      <button class="btn btn-secondary" @click="copy">复制结果</button>
      <button class="btn btn-secondary" @click="exportFile">导出文件</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">示例</button>
    </div>
    <div class="tool-section" style="margin-top:16px">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea v-model="input" class="textarea" :placeholder="direction === 'json-to-csv' ? '输入 JSON 数组...' : '输入 CSV 内容...'" rows="16"></textarea>
      </div>
      <div class="tool-panel">
        <h3>输出</h3>
        <textarea v-model="output" class="textarea" placeholder="转换结果..." rows="16" readonly></textarea>
      </div>
    </div>
    <div v-if="preview.length && direction === 'json-to-csv'" class="card" style="margin-top:16px;overflow:auto">
      <h3 style="font-size:14px;margin-bottom:10px">表格预览（前 5 行）</h3>
      <table style="width:100%;font-size:13px;border-collapse:collapse;min-width:400px">
        <thead>
          <tr style="border-bottom:1px solid var(--border)">
            <th v-for="key in Object.keys(preview[0])" :key="key" style="text-align:left;padding:6px">{{ key }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in preview" :key="i" style="border-bottom:1px solid var(--border)">
            <td v-for="key in Object.keys(preview[0])" :key="key" style="padding:6px">{{ row[key] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="error" class="error-msg" style="margin-top:10px">❌ {{ error }}</div>
  </div>
</template>

<style scoped>
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  font-size: 14px;
}
</style>
