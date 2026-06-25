<script setup>
import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { toMartian, toNormal, DIRECTIONS } from '../../logic/martianText'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const direction = useStorage('martian-direction', 'toMartian')

function processor(val) {
  return direction.value === 'toMartian' ? toMartian(val) : toNormal(val)
}

const {
  input,
  output,
  error,
  autoMode,
  copyText,
  clearAll,
  loadExample,
  process,
  copy
} = useTool({
  storageKey: 'martian',
  processor,
  paramMapping: {
    text: { ref: input },
    direction: { ref: direction }
  },
  example: '我爱你，世界！'
})

watch(direction, () => {
  if (autoMode.value) process()
})

function swap() {
  direction.value = direction.value === 'toMartian' ? 'toNormal' : 'toMartian'
  const tmp = input.value
  input.value = output.value
  output.value = tmp
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>👽 火星文翻译器</h1>
      <AiHelpPanel
        title="火星文翻译器"
        desc="中文与火星文互相转换，提供常用字符映射表"
        api-tool="martian_text"
        :params="[
          { name: 'text', desc: '要转换的文本', required: true, example: '我爱你' },
          { name: 'direction', desc: '方向：toMartian / toNormal', required: false, example: 'toMartian' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="card config-bar">
      <div class="config-row">
        <label v-for="d in DIRECTIONS" :key="d.value" class="radio-label">
          <input v-model="direction" type="radio" :value="d.value"> {{ d.label }}
        </label>
      </div>
    </div>

    <div class="tool-actions">
      <button class="btn" @click="process">转换</button>
      <button class="btn btn-secondary" @click="swap">🔄 交换</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">示例</button>
      <button class="btn btn-secondary" @click="copy">{{ copyText }}</button>
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>

    <div class="tool-section">
      <div class="tool-panel">
        <h3>{{ direction === 'toMartian' ? '普通文' : '火星文' }}</h3>
        <textarea v-model="input" class="textarea" placeholder="输入文本..." rows="14"></textarea>
      </div>
      <div class="tool-panel">
        <h3>{{ direction === 'toMartian' ? '火星文' : '普通文' }}</h3>
        <textarea v-model="output" class="textarea" placeholder="转换结果..." rows="14" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self: flex-start">{{ copyText }}</button>
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
