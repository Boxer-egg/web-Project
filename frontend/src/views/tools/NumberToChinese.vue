<script setup>
import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import { convert } from '../../logic/numberChinese'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const mode = useStorage('numchinese-mode', 'upper')
const toast = useToast()

const customInput = ref('')

function processor(val) {
  return convert(val, mode.value)
}

const {
  input,
  output,
  error,
  autoMode,
  copyText,
  clearAll: baseClear,
  loadExample,
  process: convertNumber,
  copy
} = useTool({
  storageKey: 'numchinese',
  processor,
  paramMapping: {
    number: { ref: customInput },
    mode: { ref: mode }
  },
  customInput,
  example: '1024.5'
})

watch(mode, () => {
  if (autoMode.value) convertNumber()
})

function handleLoadExample() {
  customInput.value = '1024.5'
  convertNumber()
}

function clearAll() {
  baseClear()
}

function copyResult() {
  if (!output.value) return
  copy()
}

const modeLabel = {
  upper: '中文大写金额',
  lower: '中文小写读法',
  currency: '人民币格式'
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🔢 数字转中文</h1>
      <AiHelpPanel
        title="数字转中文"
        desc="阿拉伯数字转换为中文大写金额、中文小写读法或人民币格式"
        api-tool="number_chinese"
        :params="[
          { name: 'number', desc: '要转换的数字', required: true, example: '1024.5' },
          { name: 'mode', desc: '模式：upper / lower / currency', required: false, example: 'upper' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="card config-bar">
      <div class="config-row">
        <label class="radio-label">
          <input type="radio" v-model="mode" value="upper"> 中文大写金额
        </label>
        <label class="radio-label">
          <input type="radio" v-model="mode" value="lower"> 中文小写读法
        </label>
        <label class="radio-label">
          <input type="radio" v-model="mode" value="currency"> 人民币格式
        </label>
      </div>
    </div>

    <div class="tool-actions">
      <button class="btn" @click="convertNumber">转换</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="handleLoadExample">示例</button>
      <button class="btn btn-secondary" @click="copyResult">复制结果</button>
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>

    <div class="tool-section" style="flex-direction: column; gap: 16px;">
      <div class="tool-panel">
        <h3>输入数字</h3>
        <input
          v-model="customInput"
          class="input"
          type="text"
          placeholder="输入阿拉伯数字，例如 1024.5..."
          style="width: 100%; max-width: 400px;"
        >
      </div>
      <div class="tool-panel">
        <h3>转换结果（{{ modeLabel[mode] }}）</h3>
        <textarea
          v-model="output"
          class="textarea"
          :placeholder="modeLabel[mode] + '...'"
          rows="4"
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
.radio-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
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
