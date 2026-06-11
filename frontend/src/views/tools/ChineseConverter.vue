<script setup>
import { ref } from 'vue'
import { useTool } from '../../composables/useTool'
import * as convLogic from '../../logic/chinese-converter'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const direction = ref('s2t')

const {
  input: textInput,
  output,
  clearAll,
  copy,
  copyText
} = useTool({
  storageKey: 'chinese',
  processor: (val) => convLogic.convert(val, direction.value),
  paramMapping: { 
    text: { ref: ref('') }, 
    direction: { ref: direction }
  }
})

function swap() {
  direction.value = direction.value === 's2t' ? 't2s' : 's2t'
  const tmp = textInput.value
  textInput.value = output.value
  output.value = tmp
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🈷️ 简繁体转换</h1>
      <AiHelpPanel
        title="简繁体转换"
        desc="简体中文与繁体中文互相转换，覆盖约2000个常用汉字"
        :params="[
          { name: 'text', desc: '要转换的文本', required: true, example: '简体转繁体测试' },
          { name: 'direction', desc: '转换方向：s2t（简→繁）或 t2s（繁→简）', required: false, example: 's2t' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-actions">
      <button class="btn" :class="{ 'btn-secondary': direction !== 's2t' }" @click="direction = 's2t'">简体 → 繁体</button>
      <button class="btn" :class="{ 'btn-secondary': direction !== 't2s' }" @click="direction = 't2s'">繁体 → 简体</button>
      <button class="btn btn-secondary" @click="swap">🔄 交换</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>{{ direction === 's2t' ? '简体' : '繁体' }}</h3>
        <textarea v-model="textInput" class="textarea" placeholder="输入文本..." rows="16"></textarea>
      </div>
      <div class="tool-panel">
        <h3>{{ direction === 's2t' ? '繁体' : '简体' }}</h3>
        <textarea v-model="output" class="textarea" placeholder="转换结果..." rows="16" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self: flex-start">{{ copyText }}</button>
      </div>
    </div>
  </div>
</template>
