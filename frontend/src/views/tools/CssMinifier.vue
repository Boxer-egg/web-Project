<script setup>
import { computed, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { minifyCss } from '../../logic/cssMinifier'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const cssInput = ref('')

const options = {
  minifyColor: useStorage('css-minifier-minifyColor', false),
  minifyZero: useStorage('css-minifier-minifyZero', false),
  mergeDuplicates: useStorage('css-minifier-mergeDuplicates', false),
  removeEmpty: useStorage('css-minifier-removeEmpty', false),
  removeQuotes: useStorage('css-minifier-removeQuotes', false),
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
  storageKey: 'css-minifier',
  customInput: cssInput,
  paramMapping: { css: { ref: cssInput } },
  processor: (val) => {
    const result = minifyCss(val, {
      minifyColor: options.minifyColor.value,
      minifyZero: options.minifyZero.value,
      mergeDuplicates: options.mergeDuplicates.value,
      removeEmpty: options.removeEmpty.value,
      removeQuotes: options.removeQuotes.value,
    })
    return result.css
  },
  example: `/* 示例 CSS */
body {
  margin: 0px;
  color: #ffffff;
}

.empty { }
`
})

const stats = computed(() => {
  if (!input.value || !output.value) return null
  return minifyCss(input.value, {
    minifyColor: options.minifyColor.value,
    minifyZero: options.minifyZero.value,
    mergeDuplicates: options.mergeDuplicates.value,
    removeEmpty: options.removeEmpty.value,
    removeQuotes: options.removeQuotes.value,
  })
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🗜️ CSS 压缩</h1>
      <AiHelpPanel
        title="CSS 压缩"
        desc="在线 CSS 压缩工具，支持删除注释空白和多种可选优化"
        api-tool="css_minifier"
        :params="[
          { name: 'css', desc: '原始 CSS 代码', required: true, example: 'body { margin: 0; }' },
          { name: 'minify_color', desc: '简化颜色值', required: false, example: '1' },
          { name: 'minify_zero', desc: '简化零值单位', required: false, example: '1' },
          { name: 'merge_duplicates', desc: '合并重复声明', required: false, example: '1' },
          { name: 'remove_empty', desc: '移除空规则', required: false, example: '1' },
          { name: 'remove_quotes', desc: '删除不必要引号', required: false, example: '1' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-actions">
      <button class="btn" @click="process">压缩</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">加载示例</button>
      <button class="btn btn-secondary" @click="copy">{{ copyText }}</button>
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>
    <div class="tool-options card">
      <h3 style="margin-bottom:10px;font-size:14px">优化选项</h3>
      <label><input type="checkbox" v-model="options.minifyColor"> 简化颜色值</label>
      <label><input type="checkbox" v-model="options.minifyZero"> 简化零值单位</label>
      <label><input type="checkbox" v-model="options.mergeDuplicates"> 合并重复声明</label>
      <label><input type="checkbox" v-model="options.removeEmpty"> 移除空规则</label>
      <label><input type="checkbox" v-model="options.removeQuotes"> 删除不必要引号</label>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入 CSS</h3>
        <textarea v-model="input" class="textarea" rows="14" placeholder="粘贴 CSS 代码..."></textarea>
      </div>
      <div class="tool-panel">
        <h3>压缩结果</h3>
        <textarea v-model="output" class="textarea" rows="14" readonly placeholder="压缩后的 CSS..."></textarea>
        <div v-if="stats" class="stats-bar">
          原始：{{ stats.originalLength }}B → 压缩：{{ stats.minifiedLength }}B（节省 {{ stats.savedPercent }}）
        </div>
        <div v-if="error" class="error-text">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
  margin: 16px 0;
  font-size: 13px;
}
.tool-options label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.stats-bar {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}
.error-text {
  margin-top: 8px;
  color: var(--danger);
  font-size: 13px;
}
</style>
