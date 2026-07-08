<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import { useToast } from '../../composables/useToast'
import { getUrlParams } from '../../utils/urlParams'
import {
  calculateRelationship,
  normalizeChain,
  chainToPath,
  RELATION_BUTTONS,
  REGION_OPTIONS
} from '../../logic/relationship'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const TAB_MODES = [
  {
    key: 'query',
    label: '查称呼',
    icon: '🔍',
    desc: '输入关系链，算出正确称呼',
    help: '点击下面的关系按钮（爸爸、妈妈、哥哥等）依次构建关系链，或直接输入“爸爸的妈妈的哥哥”，即可得出你应该如何称呼对方。'
  },
  {
    key: 'reverse',
    label: '查关系链',
    icon: '↩️',
    desc: '输入称呼，反推关系链',
    help: '输入一个常见称呼（如“舅公”、“堂姐”），工具会列出这个称呼通常对应的几种关系链，例如“妈妈的妈妈的兄弟”。'
  },
  {
    key: 'pair',
    label: '两人互称',
    icon: '👥',
    desc: '输入两位亲戚相对你的关系，查出他们之间如何称呼',
    help: '分别输入两位亲戚与你之间的关系链。例如你填“姥姥”和“表哥”，工具会算出他们两人之间的合称（舅眷外祖母 / 奶奶）。'
  }
]

const mode = useStorage('relationship-mode', 'query')
const sex = useStorage('relationship-sex', 1)
const region = useStorage('relationship-region', 'default')
const reverse = useStorage('relationship-reverse', false)
const input = useStorage('relationship-input', '')
const pairTarget = useStorage('relationship-pair-target', '')

const activeInput = ref('main') // for pair mode: 'main' or 'pair'
const result = ref(null)
const toast = useToast()

const activeTab = computed({
  get: () => TAB_MODES.find(t => t.key === mode.value) || TAB_MODES[0],
  set: (tab) => {
    mode.value = tab.key
    result.value = null
  }
})

const sexOptions = [
  { value: 1, label: '男' },
  { value: 0, label: '女' }
]

const directionOptions = [
  { value: false, label: '我称呼Ta' },
  { value: true, label: 'Ta称呼我' }
]

const pathText = computed(() => {
  if (mode.value !== 'query') return ''
  return chainToPath(input.value)
})

function compute() {
  try {
    if (mode.value === 'pair') {
      result.value = calculateRelationship(input.value, 'pair', sex.value, false, region.value, pairTarget.value)
    } else if (mode.value === 'reverse') {
      result.value = calculateRelationship(input.value, 'reverse', sex.value, false, region.value)
    } else {
      result.value = calculateRelationship(input.value, 'query', sex.value, reverse.value, region.value)
    }
  } catch (e) {
    toast.error(e.message)
    result.value = null
  }
}

function appendRelation(value) {
  const target = mode.value === 'pair' ? (activeInput.value === 'pair' ? pairTarget : input) : input
  const current = target.value.trim()
  if (!current) {
    target.value = value
  } else {
    const sep = /[,，的\s]$/.test(current) ? '' : '的'
    target.value = normalizeChain(current) + sep + value
  }
  if (mode.value === 'query') compute()
}

function backspace() {
  const target = mode.value === 'pair' && activeInput.value === 'pair' ? pairTarget : input
  const text = normalizeChain(target.value)
  if (!text) return
  const idx = text.lastIndexOf('的')
  target.value = idx > 0 ? text.slice(0, idx) : ''
  if (mode.value === 'query') compute()
}

function clear() {
  input.value = ''
  pairTarget.value = ''
  result.value = null
}

function setActiveInput(name) {
  activeInput.value = name
}

function copy(text) {
  navigator.clipboard.writeText(text)
  toast.success('已复制')
}

function handleInputKeydown(e) {
  if (e.key === 'Enter') compute()
}

onMounted(() => {
  const params = getUrlParams()
  if (params.get('mode') && ['query', 'reverse', 'pair'].includes(params.get('mode'))) {
    mode.value = params.get('mode')
  }
  if (params.get('sex') !== null) {
    sex.value = params.get('sex') === '0' ? 0 : 1
  }
  if (params.get('region') !== null && ['default', 'northern', 'cantonese'].includes(params.get('region'))) {
    region.value = params.get('region')
  }
  if (params.get('reverse') !== null) {
    reverse.value = params.get('reverse') === '1' || params.get('reverse') === 'true'
  }
  if (params.get('chain')) {
    mode.value = 'query'
    input.value = params.get('chain')
  }
  if (params.get('title')) {
    mode.value = 'reverse'
    input.value = params.get('title')
  }
  if (params.get('a') || params.get('text')) {
    mode.value = 'pair'
    input.value = params.get('a') || params.get('text') || ''
    pairTarget.value = params.get('b') || params.get('target') || ''
  }
  if (params.get('auto') === '1') compute()
})

watch([sex, region, reverse], () => {
  if (input.value.trim() && result.value) compute()
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>👨‍👩‍👧‍👦 亲戚关系计算</h1>
      <AiHelpPanel
        title="亲戚关系计算"
        desc="三种模式：查称呼、查关系链、两人互称"
        api-tool="relationship"
        :params="[
          { name: 'chain', desc: '关系链（query 模式），如 爸爸,妈妈,哥哥', required: false, example: '爸爸,妈妈,哥哥' },
          { name: 'title', desc: '称谓（reverse 模式），如 舅公', required: false, example: '舅公' },
          { name: 'a / text', desc: '我的关系链（pair 模式）', required: false, example: '姥姥' },
          { name: 'b / target', desc: '对方关系链（pair 模式）', required: false, example: '表哥' },
          { name: 'mode', desc: 'query / reverse / pair，默认 query', required: false, example: 'query' },
          { name: 'sex', desc: '性别：0 女 / 1 男，默认 1', required: false, example: '1' },
          { name: 'region', desc: '地区：default / northern / cantonese', required: false, example: 'default' },
          { name: 'reverse', desc: 'query 模式下：1 表示 Ta称呼我，默认 0', required: false, example: '0' },
          { name: 'auto', desc: '是否自动计算（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <!-- Mode tabs -->
    <div class="tabs">
      <button
        v-for="tab in TAB_MODES"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: mode === tab.key }"
        @click="activeTab = tab"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-text">{{ tab.label }}</span>
        <span class="tab-desc">{{ tab.desc }}</span>
      </button>
    </div>

    <!-- Help banner for active mode -->
    <div class="help-banner">
      <span class="help-icon">💡</span>
      <p>{{ activeTab.help }}</p>
    </div>

    <div class="tool-section">
      <div class="tool-panel card">
        <h3>{{ activeTab.label }}</h3>

        <!-- Common options -->
        <div class="options-bar">
          <div class="option-group">
            <span class="option-label">性别</span>
            <label
              v-for="opt in sexOptions"
              :key="opt.value"
              class="chip"
              :class="{ active: sex === opt.value }"
            >
              <input v-model.number="sex" type="radio" :value="opt.value">
              <span>{{ opt.label }}</span>
            </label>
          </div>
          <div class="option-group">
            <span class="option-label">地区</span>
            <label
              v-for="opt in REGION_OPTIONS"
              :key="opt.value"
              class="chip"
              :class="{ active: region === opt.value }"
            >
              <input v-model="region" type="radio" :value="opt.value">
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <!-- Query mode -->
        <div v-if="mode === 'query'">
          <div class="config-row">
            <label>称呼方向</label>
            <div class="direction-options">
              <label
                v-for="opt in directionOptions"
                :key="String(opt.value)"
                class="chip"
                :class="{ active: reverse === opt.value }"
              >
                <input v-model="reverse" type="radio" :value="opt.value">
                <span>{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <div class="config-row">
            <label>关系链</label>
            <input
              v-model="input"
              type="text"
              class="input"
              placeholder="例如：爸爸,妈妈,哥哥"
              @keydown="handleInputKeydown"
            >
            <p v-if="pathText" class="path-text">{{ pathText }}</p>
          </div>
        </div>

        <!-- Reverse mode -->
        <div v-else-if="mode === 'reverse'">
          <div class="config-row">
            <label>称谓</label>
            <input
              v-model="input"
              type="text"
              class="input"
              placeholder="例如：舅公、堂姐、老舅、大姑"
              @keydown="handleInputKeydown"
            >
          </div>
        </div>

        <!-- Pair mode -->
        <div v-else-if="mode === 'pair'">
          <div class="config-row">
            <label
              :class="{ active: activeInput === 'main' }"
              @click="setActiveInput('main')"
            >
              我的关系链（第一方）
            </label>
            <input
              v-model="input"
              type="text"
              class="input"
              :class="{ focused: activeInput === 'main' }"
              placeholder="例如：姥姥"
              @focus="setActiveInput('main')"
              @keydown="handleInputKeydown"
            >
          </div>
          <div class="config-row">
            <label
              :class="{ active: activeInput === 'pair' }"
              @click="setActiveInput('pair')"
            >
              对方关系链（第二方）
            </label>
            <input
              v-model="pairTarget"
              type="text"
              class="input"
              :class="{ focused: activeInput === 'pair' }"
              placeholder="例如：表哥"
              @focus="setActiveInput('pair')"
              @keydown="handleInputKeydown"
            >
          </div>
        </div>

        <!-- Button panel for chain building -->
        <div v-if="mode !== 'reverse'" class="button-panel">
          <div class="panel-hint">
            点击按钮快速构建关系链
            <span v-if="mode === 'pair'">（当前输入框：{{ activeInput === 'pair' ? '对方关系链' : '我的关系链' }}）</span>
          </div>
          <div v-for="group in RELATION_BUTTONS" :key="group.group" class="button-group">
            <span class="button-group-label">{{ group.group }}</span>
            <div class="button-group-items">
              <button
                v-for="item in group.items"
                :key="item.value"
                class="btn btn-sm btn-secondary relation-btn"
                @click="appendRelation(item.value)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="tool-actions">
          <button class="btn" @click="compute">
            {{ mode === 'query' ? '计算称呼' : mode === 'reverse' ? '反查关系链' : '算两人称呼' }}
          </button>
          <button v-if="mode !== 'reverse'" class="btn btn-secondary" @click="backspace">回退</button>
          <button class="btn btn-secondary" @click="clear">清空</button>
        </div>
      </div>

      <div class="tool-panel card">
        <h3>结果</h3>
        <div v-if="result" class="result-block">
          <!-- query mode -->
          <div v-if="result.mode === 'query'">
            <div class="result-row">
              <span class="result-label">关系路径</span>
              <code class="result-value">{{ result.path }}</code>
            </div>
            <div class="result-row">
              <span class="result-label">{{ result.reverse ? 'Ta 称呼我' : '我称呼 Ta' }}</span>
              <div class="tag-list">
                <span
                  v-for="title in result.titles"
                  :key="title"
                  class="result-tag"
                >
                  {{ title || '未知' }}
                </span>
              </div>
            </div>
          </div>

          <!-- reverse mode -->
          <div v-else-if="result.mode === 'reverse'" class="reverse-results">
            <div class="result-row">
              <span class="result-label">称谓</span>
              <code class="result-value">{{ result.title }}</code>
            </div>
            <div class="result-row">
              <span class="result-label">对应的关系链</span>
              <div class="chain-list">
                <div
                  v-for="(item, idx) in result.results"
                  :key="idx"
                  class="chain-card"
                >
                  <div class="chain-card-title">{{ item.title || '-' }}</div>
                  <div class="chain-card-body">
                    <div class="chain-card-item">
                      <span class="chain-card-key">关系链</span>
                      <span class="chain-card-value">{{ item.chain || '-' }}</span>
                    </div>
                    <div class="chain-card-item">
                      <span class="chain-card-key">说明</span>
                      <span class="chain-card-value">{{ item.detail || '-' }}</span>
                    </div>
                  </div>
                  <div class="chain-card-actions">
                    <button
                      v-if="item.chain"
                      class="btn btn-sm btn-secondary"
                      @click="copy(item.chain)"
                    >
                      复制关系链
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- pair mode -->
          <div v-else-if="result.mode === 'pair'">
            <div class="result-row">
              <span class="result-label">双方关系路径</span>
              <div class="pair-paths">
                <div class="pair-path"><strong>我 →</strong> {{ result.pathA.replace(/^我 → /, '') }}</div>
                <div class="pair-path"><strong>对方 →</strong> {{ result.pathB.replace(/^我 → /, '') }}</div>
              </div>
            </div>
            <div class="result-row">
              <span class="result-label">两人之间的称呼</span>
              <div class="tag-list">
                <span
                  v-for="title in result.titles"
                  :key="title"
                  class="result-tag"
                >
                  {{ title || '未知' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          {{ mode === 'query' ? '输入关系链后点击“计算称呼”' : mode === 'reverse' ? '输入称谓后点击“反查关系链”' : '输入双方关系链后点击“算两人称呼”' }}
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

/* Tabs */
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.tab-btn {
  flex: 1;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}
.tab-btn.active {
  border-color: var(--accent);
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent);
}
.tab-icon {
  font-size: 22px;
}
.tab-text {
  font-size: 15px;
  font-weight: 600;
}
.tab-desc {
  font-size: 12px;
  opacity: 0.8;
}

/* Help banner */
.help-banner {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  margin-bottom: 20px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: var(--radius);
  color: var(--text-primary);
}
.help-banner p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}
.help-icon {
  font-size: 18px;
  flex-shrink: 0;
}

/* Options bar */
.options-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}
.option-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.option-label {
  font-size: 13px;
  color: var(--text-secondary);
}
.chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.chip:hover {
  border-color: var(--accent);
}
.chip.active {
  border-color: var(--accent);
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}
.chip input {
  margin: 0;
}

.config-row {
  margin-bottom: 16px;
}
.config-row label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.config-row label.active {
  color: var(--accent);
  font-weight: 500;
}
.direction-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.input.focused {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}
.path-text {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--accent);
  font-weight: 500;
}

/* Button panel */
.button-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}
.panel-hint {
  font-size: 12px;
  color: var(--text-muted);
}
.panel-hint span {
  color: var(--accent);
  font-weight: 500;
}
.button-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.button-group-label {
  font-size: 12px;
  color: var(--text-muted);
  width: 44px;
  flex-shrink: 0;
}
.button-group-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}
.relation-btn {
  min-width: 52px;
}

/* Actions */
.tool-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

/* Results */
.result-block {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.result-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.result-label {
  font-size: 13px;
  color: var(--text-secondary);
}
.result-value {
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 15px;
  color: var(--text-primary);
  word-break: break-all;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.result-tag {
  display: inline-block;
  padding: 8px 14px;
  border-radius: var(--radius);
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-size: 15px;
  font-weight: 500;
}

/* Reverse chain cards */
.chain-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chain-card {
  padding: 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.chain-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 10px;
}
.chain-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}
.chain-card-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}
.chain-card-key {
  color: var(--text-secondary);
  width: 48px;
  flex-shrink: 0;
}
.chain-card-value {
  color: var(--text-primary);
  word-break: break-all;
}
.chain-card-actions {
  display: flex;
  justify-content: flex-end;
}

/* Pair paths */
.pair-paths {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pair-path {
  font-size: 14px;
  color: var(--text-primary);
}

.empty-state {
  color: var(--text-muted);
  padding: 40px;
  text-align: center;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}

@media (max-width: 768px) {
  .tabs {
    flex-direction: column;
  }
  .tab-btn {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    gap: 4px 10px;
    padding: 12px;
    min-width: auto;
  }
  .tab-icon {
    font-size: 20px;
    flex-shrink: 0;
  }
  .tab-text {
    font-size: 15px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .tab-desc {
    width: 100%;
    font-size: 12px;
    opacity: 0.8;
    text-align: left;
    padding-left: 30px;
    box-sizing: border-box;
  }
  .options-bar {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
