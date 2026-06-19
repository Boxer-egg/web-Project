<script setup>
import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import { yamlToJson, jsonToYaml } from '../../logic/yamlJson'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const direction = useStorage('yamljson-direction', 'yaml2json')
const compact = useStorage('yamljson-compact', false)
const indent = useStorage('yamljson-indent', 2)
const toast = useToast()

const exampleYaml = `name: John Doe
age: 30
address:
  city: Beijing
  zip: 100000
hobbies:
  - reading
  - coding`

const exampleJson = JSON.stringify({
  name: 'John Doe',
  age: 30,
  address: { city: 'Beijing', zip: 100000 },
  hobbies: ['reading', 'coding']
}, null, 2)

function processor(val) {
  if (direction.value === 'yaml2json') {
    return yamlToJson(val, compact.value)
  }
  return jsonToYaml(val, compact.value)
}

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
  storageKey: 'yamljson',
  processor,
  paramMapping: {
    input: { ref: input },
    direction: { ref: direction },
    compact: { ref: compact, transform: v => v === '1' }
  },
  example: exampleYaml
})

watch([direction, compact, indent], () => {
  if (autoMode.value) convert()
})

function swap() {
  const oldInput = input.value
  const oldOutput = output.value
  if (direction.value === 'yaml2json') {
    direction.value = 'json2yaml'
  } else {
    direction.value = 'yaml2json'
  }
  input.value = oldOutput || oldInput
  if (autoMode.value) {
    convert()
  } else {
    output.value = oldInput
  }
}

function handleLoadExample() {
  if (direction.value === 'yaml2json') {
    input.value = exampleYaml
  } else {
    input.value = exampleJson
  }
  convert()
}

function clearAll() {
  baseClear()
}

function copyResult() {
  if (!output.value) return
  copy()
}

const inputPlaceholder = direction.value === 'yaml2json' ? '输入 YAML...' : '输入 JSON...'
const outputPlaceholder = direction.value === 'yaml2json' ? 'JSON 结果...' : 'YAML 结果...'
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🔄 YAML ↔ JSON 转换</h1>
      <AiHelpPanel
        title="YAML ↔ JSON 转换"
        desc="YAML 与 JSON 格式互相转换，支持紧凑输出和缩进选项"
        api-tool="yaml_json"
        :params="[
          { name: 'input', desc: '要转换的文本内容', required: true, example: '{&quot;name&quot;:&quot;John&quot;}' },
          { name: 'direction', desc: '方向：yaml2json 或 json2yaml', required: false, example: 'yaml2json' },
          { name: 'compact', desc: '是否紧凑输出（填 1）', required: false, example: '0' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="card config-bar">
      <div class="config-row">
        <label class="radio-label">
          <input type="radio" v-model="direction" value="yaml2json"> YAML → JSON
        </label>
        <label class="radio-label">
          <input type="radio" v-model="direction" value="json2yaml"> JSON → YAML
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="compact"> 紧凑输出
        </label>
        <select v-model="indent" class="input compact-select">
          <option :value="2">2 空格缩进</option>
          <option :value="4">4 空格缩进</option>
        </select>
      </div>
    </div>

    <div class="tool-actions">
      <button class="btn" @click="convert">转换</button>
      <button class="btn btn-secondary" @click="swap">交换</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="handleLoadExample">示例</button>
      <button class="btn btn-secondary" @click="copyResult">复制结果</button>
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>

    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea
          v-model="input"
          class="textarea"
          :placeholder="direction === 'yaml2json' ? '输入 YAML...' : '输入 JSON...'"
          rows="16"
        ></textarea>
      </div>
      <div class="tool-panel">
        <h3>输出</h3>
        <textarea
          v-model="output"
          class="textarea"
          :placeholder="direction === 'yaml2json' ? 'JSON 结果...' : 'YAML 结果...'"
          rows="16"
          readonly
        ></textarea>
        <button class="btn btn-sm" @click="copyResult" style="align-self:flex-start">{{ copyText }}</button>
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
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-top: 10px;
  font-size: 14px;
}
</style>
