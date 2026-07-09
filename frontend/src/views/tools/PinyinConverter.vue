<script setup>
import { ref, watch, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { convertToPinyin, convertToPinyinPairs, TONE_MODES } from '../../logic/pinyin'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const tone = useStorage('pinyin-tone', 'tone')
const segment = useStorage('pinyin-segment', false)
const preserve = useStorage('pinyin-preserve', true)
const stats = ref({ chineseCount: 0, nonChineseCount: 0 })
const input = ref('')

function processor(val) {
  const result = convertToPinyin(val, {
    tone: tone.value,
    segment: segment.value,
    preserveNonChinese: preserve.value
  })
  stats.value = {
    chineseCount: result.chineseCount,
    nonChineseCount: result.nonChineseCount
  }
  return result.pinyin
}

const {
  output,
  error,
  autoMode,
  copyText,
  clearAll,
  loadExample,
  process: convertText,
  copy
} = useTool({
  storageKey: 'pinyin',
  processor,
  paramMapping: {
    text: { ref: input },
    tone: { ref: tone },
    segment: { ref: segment, transform: v => v === '1' },
    preserve: { ref: preserve, transform: v => v === '1' }
  },
  customInput: input,
  example: '你好，世界！重庆欢迎您。'
})

const pairs = computed(() => {
  if (!input.value) return []
  const result = convertToPinyinPairs(input.value, {
    tone: tone.value,
    segment: segment.value,
    preserveNonChinese: preserve.value
  })
  stats.value = {
    chineseCount: result.chineseCount,
    nonChineseCount: result.nonChineseCount
  }
  return result.pairs
})

watch([tone, segment, preserve], () => {
  if (autoMode.value) convertText()
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🔤 文字转拼音</h1>
      <AiHelpPanel
        title="文字转拼音"
        desc="将中文文本转换为拼音，支持带声调、无声调、首字母三种模式"
        api-tool="pinyin"
        :params="[
          { name: 'text', desc: '要转换的文本', required: true, example: '你好世界' },
          { name: 'tone', desc: '声调模式：tone / none / first', required: false, example: 'tone' },
          { name: 'segment', desc: '是否按词分词（填 1）', required: false, example: '1' },
          { name: 'preserve', desc: '是否保留非中文字符（填 1）', required: false, example: '1' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="card config-bar">
      <div class="config-row">
        <label v-for="m in TONE_MODES" :key="m.value" class="radio-label">
          <input v-model="tone" type="radio" :value="m.value"> {{ m.label }}
        </label>
        <label class="radio-label">
          <input v-model="segment" type="checkbox"> 分词
        </label>
        <label class="radio-label">
          <input v-model="preserve" type="checkbox"> 保留非中文
        </label>
      </div>
    </div>

    <div class="tool-actions">
      <button class="btn" @click="convertText">转换</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">示例</button>
      <button class="btn btn-secondary" @click="copy">{{ copyText }}</button>
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>

    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入文本</h3>
        <textarea v-model="input" class="textarea" placeholder="输入中文文本..." rows="12"></textarea>
      </div>
      <div class="tool-panel">
        <h3>拼音结果</h3>
        <textarea v-model="output" class="textarea" placeholder="拼音..." rows="12" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self: flex-start">{{ copyText }}</button>
      </div>
    </div>

    <div v-if="pairs.length" class="card pinyin-pairs-card">
      <h3>字音对照</h3>
      <div class="pinyin-pairs">
        <template v-for="(pair, index) in pairs" :key="index">
          <div v-if="pair.char === '\n'" class="line-break"></div>
          <div v-else class="pinyin-pair" :class="{ 'non-zh': !pair.isZh }">
            <div class="pinyin-text">{{ pair.pinyin || ' ' }}</div>
            <div class="char-text">{{ pair.char }}</div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="input" class="card stats-bar">
      中文字符：{{ stats.chineseCount }} 个｜非中文字符：{{ stats.nonChineseCount }} 个
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
.stats-bar {
  margin-top: 16px;
  padding: 10px 16px;
  font-size: 13px;
  color: var(--text-secondary);
}
.pinyin-pairs-card {
  margin-top: 20px;
  padding: 16px;
}
.pinyin-pairs-card h3 {
  margin: 0 0 12px;
  font-size: 15px;
  color: var(--text-primary);
}
.pinyin-pairs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 4px;
  line-height: 1.4;
}
.pinyin-pair {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 1.2em;
  padding: 2px 4px;
  border-radius: var(--radius);
}
.pinyin-pair.non-zh {
  opacity: 0.7;
}
.pinyin-text {
  font-size: 13px;
  color: var(--text-secondary);
  min-height: 1.4em;
  white-space: nowrap;
}
.char-text {
  font-size: 18px;
  color: var(--text-primary);
}
.line-break {
  flex-basis: 100%;
  height: 0;
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
