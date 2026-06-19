<script setup>
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import * as loremLogic from '../../logic/lorem'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const paragraphs = useStorage('lorem-paragraphs', 3)
const sentences = useStorage('lorem-sentences', 5)

const {
  output,
  clearAll,
  copy,
  process: generate
} = useTool({
  storageKey: 'lorem',
  processor: () => loremLogic.generate(paragraphs.value, sentences.value),
  paramMapping: {
    paragraphs: { ref: paragraphs, transform: v => parseInt(v) },
    sentences: { ref: sentences, transform: v => parseInt(v) }
  }
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>📃 Lorem Ipsum 生成器</h1>
      <AiHelpPanel
        title="Lorem Ipsum 生成器"
        desc="生成占位文本"
        api-tool="lorem"
        :params="[
          { name: 'paragraphs', desc: '段落数', required: false, example: '3' },
          { name: 'sentences', desc: '每段句子数', required: false, example: '5' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-actions">
      <div class="config-row">
        <label>段落: {{ paragraphs }}</label>
        <input type="range" v-model.number="paragraphs" min="1" max="20" class="range-input">
      </div>
      <div class="config-row">
        <label>每段句子: {{ sentences }}</label>
        <input type="range" v-model.number="sentences" min="1" max="10" class="range-input">
      </div>
      <button class="btn" @click="generate">生成</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输出</h3>
        <textarea v-model="output" class="textarea" rows="20" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self:flex-start">复制结果</button>
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
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 16px;
}
.config-row label {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 80px;
}
.range-input {
  width: 120px;
}
</style>
