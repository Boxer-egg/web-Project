<script setup>
import { computed, ref } from 'vue'
import { useTool } from '../../composables/useTool'
import * as wordLogic from '../../logic/word-counter'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const {
  input,
  clearAll,
  copy
} = useTool({
  storageKey: 'wordcount',
  processor: (val) => val, // Just return input, we use computed for stats
  paramMapping: { text: { ref: ref('') } },
  example: 'Hello 你好 World 世界! 这是一个字数统计示例。'
})

const stats = computed(() => wordLogic.countStats(input.value))
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>📝 字数统计</h1>
      <AiHelpPanel
        title="字数统计"
        desc="实时统计中文字数、英文单词数、字符数、段落数及阅读时间"
        :params="[
          { name: 'text', desc: '要统计的文本', required: true, example: 'Hello 你好 World 世界' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-actions">
      <button class="btn btn-secondary" @click="copy">复制输入</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入文本</h3>
        <textarea v-model="input" class="textarea" placeholder="在此粘贴或输入文本..." rows="16"></textarea>
      </div>
      <div class="tool-panel">
        <h3>统计结果</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.chinese }}</div>
            <div class="stat-label">中文字数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.englishWords }}</div>
            <div class="stat-label">英文单词</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.charsNoSpace }}</div>
            <div class="stat-label">字符数（不含空格）</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.charsWithSpace }}</div>
            <div class="stat-label">字符数（含空格）</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.paragraphs }}</div>
            <div class="stat-label">段落数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.lines }}</div>
            <div class="stat-label">行数</div>
          </div>
          <div class="stat-card full-width">
            <div class="stat-value">{{ stats.readingTime }} 分钟</div>
            <div class="stat-label">预估阅读时间</div>
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
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  text-align: center;
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}
.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 4px;
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}
.full-width {
  grid-column: 1 / -1;
}
</style>
