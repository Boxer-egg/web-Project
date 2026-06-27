<script setup>
import { ref, computed, watch } from 'vue'
import { useTool } from '../../composables/useTool'
import { lookupHanzi, getHanziCount } from '../../logic/hanziInfo'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const charInput = ref('')
const result = ref(null)

function processor(val) {
  const info = lookupHanzi(val)
  if (!info) throw new Error('请输入单个汉字，或该汉字暂无本地数据')
  result.value = info
  return info.pinyin
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
  storageKey: 'hanzi',
  processor,
  paramMapping: { char: { ref: charInput } },
  customInput: charInput,
  example: '明'
})

watch(input, (val) => {
  charInput.value = val
})

const toneMark = computed(() => {
  if (!result.value || !result.value.tone) return ''
  const marks = ['', 'ˉ', 'ˊ', 'ˇ', 'ˋ']
  return marks[result.value.tone] || ''
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>📖 汉字信息</h1>
      <AiHelpPanel
        title="汉字标准发音/偏旁"
        desc="查询单个汉字的拼音、笔画、部首、偏旁、结构和释义"
        api-tool="hanzi_info"
        :params="[
          { name: 'char', desc: '要查询的单个汉字', required: true, example: '明' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="card config-bar">
      <div class="input-row">
        <input
          v-model="charInput"
          class="input"
          type="text"
          maxlength="1"
          placeholder="输入单个汉字..."
          style="width: 120px; text-align: center; font-size: 24px;"
        >
        <button class="btn" @click="process">查询</button>
        <button class="btn btn-secondary" @click="clearAll">清空</button>
        <button class="btn btn-secondary" @click="loadExample">示例</button>
        <button class="btn btn-secondary" @click="copy">{{ copyText }}</button>
        <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
          自动 {{ autoMode ? 'ON' : 'OFF' }}
        </button>
      </div>
      <p class="hint">本地收录 {{ getHanziCount() }} 个常用汉字；未收录的字会使用 pinyin-pro 给出拼音参考。</p>
    </div>

    <div v-if="result" class="result-card card">
      <div class="char-display">{{ result.char }}</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">拼音</span>
          <span class="value">{{ result.pinyin }} {{ toneMark }}</span>
        </div>
        <div class="info-item">
          <span class="label">声调</span>
          <span class="value">第 {{ result.tone }} 声 {{ toneMark }}</span>
        </div>
        <div class="info-item">
          <span class="label">笔画</span>
          <span class="value">{{ result.strokes != null ? `${result.strokes} 画` : '—' }}</span>
        </div>
        <div class="info-item">
          <span class="label">部首</span>
          <span class="value">{{ result.radical || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="label">结构</span>
          <span class="value">{{ result.structure || '—' }}</span>
        </div>
      </div>
      <div class="meanings">
        <h4>释义</h4>
        <ul>
          <li v-for="(m, i) in result.meanings" :key="i">{{ m }}</li>
        </ul>
      </div>
      <div class="result-actions">
        <button class="btn btn-sm" @click="copy">{{ copyText }}</button>
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
  padding: 16px;
}
.input-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--text-muted);
}
.result-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.char-display {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--bg-primary);
  border-radius: var(--radius);
}
.label {
  font-size: 12px;
  color: var(--text-muted);
}
.value {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
}
.meanings h4 {
  margin-bottom: 8px;
  color: var(--text-primary);
}
.meanings ul {
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
  line-height: 1.8;
}
.result-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
