<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUrlParams } from '../../utils/urlParams'
import { useStorage } from '@vueuse/core'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const input = useStorage('wordcount-input', '')
const copyText = ref('复制结果')

const stats = computed(() => {
  const text = input.value || ''
  const chinese = (text.match(/[一-龥]/g) || []).length
  const englishWords = (text.match(/\b[a-zA-Z]+\b/g) || []).length
  const charsNoSpace = text.replace(/\s/g, '').length
  const charsWithSpace = text.length
  const paragraphs = text === '' ? 0 : text.split(/\n\s*\n/).filter(p => p.trim()).length
  const lines = text === '' ? 0 : text.split('\n').length
  const readingTime = Math.max(1, Math.ceil(chinese / 300 + englishWords / 200))
  return { chinese, englishWords, charsNoSpace, charsWithSpace, paragraphs, lines, readingTime }
})


async function copy() {
  if (!input.value) return
  try {
    await navigator.clipboard.writeText(input.value)
    copyText.value = '已复制'
    setTimeout(() => copyText.value = '复制结果', 2000)
  } catch {
    copyText.value = '复制失败'
  }
}

function clearAll() {
  input.value = ''
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('text')) {
    input.value = params.get('text')
  }
})
</script>

<template>
  <div class="tool-page">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
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
      <button class="btn btn-secondary" @click="copy">{{ copyText }}</button>
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
          <div class="stat-card" style="grid-column: 1 / -1">
            <div class="stat-value">{{ stats.readingTime }} 分钟</div>
            <div class="stat-label">预估阅读时间</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  text-align: center;
}
.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 4px;
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
