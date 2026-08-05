<script setup>
import { ref, computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import * as loremLogic from '../../logic/lorem'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const toast = useToast()

const paragraphs = useStorage('lorem-paragraphs', 5)
const sentences = useStorage('lorem-sentences', 3)
const format = useStorage('lorem-format', 'text')
const lang = useStorage('lorem-lang', 'latin')
const standardStart = useStorage('lorem-standard-start', true)

const generating = ref(false)

// 中文模式不支持标准开头，HTML 模式不支持单行
const standardEnabled = computed(() => lang.value === 'latin')
const formatOptions = computed(() => {
  const list = [
    { value: 'text', label: '纯文本' },
    { value: 'html', label: 'HTML' },
    { value: 'single', label: '单行' }
  ]
  return list
})

const {
  output,
  clearAll,
  copy
} = useTool({
  storageKey: 'lorem',
  processor: (val) => val,
  paramMapping: {
    paragraphs: { ref: paragraphs, transform: v => parseInt(v) },
    sentences: { ref: sentences, transform: v => parseInt(v) },
    lang: { ref: lang, transform: v => String(v) },
    format: { ref: format, transform: v => String(v) }
  }
})

const stats = computed(() => loremLogic.stats(output.value))

function regenerate() {
  if (lang.value === 'chinese' && standardStart.value) {
    standardStart.value = false
    toast.warn('中文模式不支持标准开头，已自动取消')
  }
  if (format.value === 'html' && lang.value === 'chinese') {
    // allowed
  }
  generating.value = true
  // 大配置下让 UI 先渲染 loading，再同步生成
  setTimeout(() => {
    output.value = loremLogic.generate(paragraphs.value, sentences.value, {
      lang: lang.value,
      format: format.value,
      standardStart: standardStart.value
    })
    generating.value = false
  }, 10)
}

// 切换配置时如果有结果，实时重新生成
watch([format, lang, standardStart], () => {
  if (output.value) regenerate()
})

function exportTxt() {
  if (!output.value) {
    toast.warn('没有可导出的内容')
    return
  }
  try {
    const blob = new Blob([output.value], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lorem-ipsum.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('已导出 TXT')
  } catch {
    toast.error('导出失败，请手动复制')
  }
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>📃 Lorem Ipsum 生成器</h1>
      <AiHelpPanel
        title="Lorem Ipsum 生成器"
        desc="生成占位文本，支持中文假文与 HTML/单行格式"
        api-tool="lorem"
        :params="[
          { name: 'paragraphs', desc: '段落数', required: false, example: '5' },
          { name: 'sentences', desc: '每段句子数', required: false, example: '3' },
          { name: 'lang', desc: '语言 latin/chinese', required: false, example: 'chinese' },
          { name: 'format', desc: '格式 text/html/single', required: false, example: 'html' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="config-area">
      <div class="config-row">
        <label>段落</label>
        <input type="range" v-model.number="paragraphs" min="1" max="50" class="range-input">
        <span class="config-val">{{ paragraphs }}</span>
      </div>
      <div class="config-row">
        <label>每段句子</label>
        <input type="range" v-model.number="sentences" min="1" max="20" class="range-input">
        <span class="config-val">{{ sentences }}</span>
      </div>
      <div class="config-row">
        <label>格式</label>
        <div class="segmented">
          <label v-for="opt in formatOptions" :key="opt.value" class="seg-label">
            <input type="radio" :value="opt.value" v-model="format">
            {{ opt.label }}
          </label>
        </div>
      </div>
      <div class="config-row">
        <label>语言</label>
        <div class="segmented">
          <label class="seg-label">
            <input type="radio" value="latin" v-model="lang"> 拉丁语
          </label>
          <label class="seg-label">
            <input type="radio" value="chinese" v-model="lang"> 中文
          </label>
        </div>
      </div>
      <div class="config-row">
        <label class="checkbox-label" :class="{ disabled: !standardEnabled }">
          <input type="checkbox" v-model="standardStart" :disabled="!standardEnabled">
          标准开头（Lorem ipsum...）
        </label>
      </div>
      <div class="config-row">
        <button class="btn" @click="regenerate" :disabled="generating">
          {{ generating ? '生成中…' : '生成' }}
        </button>
        <button class="btn btn-secondary" @click="clearAll">清空</button>
        <button class="btn btn-secondary" @click="exportTxt">导出 TXT</button>
      </div>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输出</h3>
        <div class="stats-line" v-if="output">
          <span>段落 {{ stats.paragraphs }}</span>
          <span>句子 {{ stats.sentences }}</span>
          <span>字符 {{ stats.chars }}</span>
        </div>
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
.config-area {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 24px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 20px;
  background: var(--bg-secondary);
}
.config-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.config-row label {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 70px;
}
.config-val {
  font-size: 13px;
  color: var(--text-primary);
  min-width: 24px;
}
.range-input {
  width: 140px;
}
.segmented {
  display: flex;
  gap: 4px;
}
.seg-label {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: auto !important;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
}
.checkbox-label {
  min-width: auto !important;
  color: var(--text-primary);
  cursor: pointer;
}
.checkbox-label.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.stats-line {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
</style>
