<script setup>
import { ref, watch, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import * as jsonLogic from '../../logic/json'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const indent = useStorage('json-indent', 2)
const looksEscaped = ref(false)
const validation = ref(null)

const example = JSON.stringify({
  name: '张三',
  age: 28,
  skills: ['JavaScript', 'Vue', 'Node.js'],
  address: { city: '北京', zip: '100000' },
  active: true
}, null, 2)

const {
  input,
  output,
  error,
  autoMode,
  copyText,
  clearAll,
  loadExample,
  process: format,
  copy
} = useTool({
  storageKey: 'json',
  processor: (val) => jsonLogic.format(val, indent.value),
  example
})

// Overwrite the default param mapping since useTool handles 'input' specially if we want
// Actually, let's adjust useTool to be more flexible or just use it as is.
// In this case, useTool's 'input' is the ref we want.

function compress() {
  try {
    output.value = jsonLogic.compress(input.value)
    error.value = ''
  } catch (e) {
    error.value = e.message
  }
}

function escape() {
  try {
    output.value = jsonLogic.escape(input.value)
    error.value = ''
  } catch (e) {
    error.value = e.message
  }
}

function unescape() {
  try {
    output.value = jsonLogic.unescape(input.value)
    error.value = ''
  } catch (e) {
    error.value = '去转义失败：' + e.message
  }
}

watch(input, (newVal) => {
  looksEscaped.value = jsonLogic.detectEscaped(newVal)
  validation.value = jsonLogic.validate(newVal)
}, { immediate: true })

watch(validation, (v) => {
  if (v && v.ok && autoMode.value) format()
})

watch(indent, () => {
  if (autoMode.value) format()
})

</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>📋 JSON 格式化</h1>
      <AiHelpPanel
        title="JSON 格式化"
        desc="JSON 格式化、压缩、转义和去转义"
        :params="[
          { name: 'input', desc: 'JSON 数据或转义后的 JSON 字符串', required: true, example: '{&quot;a&quot;:1}' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
      <div class="tool-actions">
        <button class="btn" @click="format">格式化</button>
        <button class="btn btn-secondary" @click="compress">压缩</button>
        <button class="btn btn-secondary" @click="escape">转义</button>
        <button class="btn" :class="looksEscaped ? '' : 'btn-secondary'" @click="unescape">去转义 {{ looksEscaped ? '←' : '' }}</button>
        <button class="btn btn-secondary" @click="clearAll">清空</button>
        <button class="btn btn-secondary" @click="loadExample">加载示例</button>
        <select v-model="indent" class="input" style="width:auto;min-width:80px">
          <option :value="2">2 空格</option>
          <option :value="4">4 空格</option>
          <option :value="'\t'">Tab</option>
        </select>
      </div>
      <div class="tool-actions">
        <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
          自动 {{ autoMode ? 'ON' : 'OFF' }}
        </button>
        <span v-if="validation" class="validation-badge" :class="validation.ok ? 'valid' : 'invalid'">
          <template v-if="validation.ok">✓ JSON 有效</template>
          <template v-else>✗ {{ validation.error }}</template>
        </span>
      </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea v-model="input" class="textarea" placeholder="在此粘贴 JSON..." rows="20"></textarea>
      </div>
      <div class="tool-panel">
        <h3>输出</h3>
        <textarea v-model="output" class="textarea" placeholder="处理结果..." rows="20" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self:flex-start">{{ copyText }}</button>
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
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-top: 10px;
  font-size: 14px;
}
.validation-badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
}
.validation-badge.valid {
  color: var(--success);
  background: rgba(34, 197, 94, 0.12);
}
.validation-badge.invalid {
  color: var(--error);
  background: rgba(239, 68, 68, 0.12);
}
</style>
