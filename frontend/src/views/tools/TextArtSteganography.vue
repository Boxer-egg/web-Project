<script setup>
import { ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import {
  MODES,
  DECORATION_TEMPLATES,
  decorateText,
  hideSecret,
  extractSecret,
  hasHiddenData
} from '../../logic/textArtSteganography'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const mode = useStorage('textart-mode', 'decorate')
const templateIndex = useStorage('textart-template', 0)
const carrier = useStorage('textart-carrier', '')
const secret = useStorage('textart-secret', '')
const hiddenInput = useStorage('textart-hidden', '')

function processor() {
  switch (mode.value) {
    case 'decorate':
      if (!carrier.value) return ''
      return decorateText(carrier.value, Number(templateIndex.value))
    case 'hide':
      if (!carrier.value || !secret.value) throw new Error('载体文本和秘密信息不能为空')
      return hideSecret(carrier.value, secret.value)
    case 'extract':
      if (!hiddenInput.value) return ''
      const extracted = extractSecret(hiddenInput.value)
      if (extracted === null) throw new Error('未检测到隐藏信息，或隐藏数据已损坏')
      return extracted
    default:
      return ''
  }
}

const {
  output,
  error,
  autoMode,
  copyText,
  clearAll,
  loadExample,
  process,
  copy
} = useTool({
  storageKey: 'textart',
  processor,
  paramMapping: {
    mode: { ref: mode },
    text: { ref: carrier },
    secret: { ref: secret },
    hidden: { ref: hiddenInput }
  },
  example: ''
})

watch([mode, templateIndex], () => {
  if (autoMode.value) process()
})

function handleLoadExample() {
  if (mode.value === 'decorate') {
    carrier.value = '你好呀'
    templateIndex.value = 0
  } else if (mode.value === 'hide') {
    carrier.value = '这是一段公开文字'
    secret.value = '秘密'
  } else {
    hiddenInput.value = hideSecret('这是一段公开文字', '秘密')
  }
  process()
}

function customClear() {
  carrier.value = ''
  secret.value = ''
  hiddenInput.value = ''
  clearAll()
}

function pasteHidden() {
  navigator.clipboard.readText().then(text => {
    hiddenInput.value = text
    if (autoMode.value) process()
  }).catch(() => {
    error.value = '无法读取剪贴板，请手动粘贴'
  })
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🎭 文本颜艺 / 文字隐写</h1>
      <AiHelpPanel
        title="文本颜艺/文字隐写"
        desc="用颜文字装饰文本，或使用零宽字符在公开文本中隐藏/提取秘密信息"
        api-tool="text_art"
        :params="[
          { name: 'mode', desc: '模式：decorate / hide / extract', required: false, example: 'decorate' },
          { name: 'text', desc: '公开文本/载体文本', required: false, example: '你好呀' },
          { name: 'secret', desc: '要隐藏的秘密文本（hide 模式）', required: false, example: '秘密' },
          { name: 'hidden', desc: '携带隐藏信息的文本（extract 模式）', required: false },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="card config-bar">
      <div class="config-row">
        <label v-for="m in MODES" :key="m.value" class="radio-label">
          <input v-model="mode" type="radio" :value="m.value"> {{ m.label }}
        </label>
      </div>
    </div>

    <!-- Decorate mode -->
    <template v-if="mode === 'decorate'">
      <div class="card config-bar">
        <div class="template-row">
          <button
            v-for="(t, i) in DECORATION_TEMPLATES"
            :key="i"
            class="btn btn-sm"
            :class="Number(templateIndex) === i ? '' : 'btn-secondary'"
            @click="templateIndex = i"
          >
            {{ t.name }}
          </button>
        </div>
      </div>
      <div class="tool-actions">
        <button class="btn" @click="process">装饰</button>
        <button class="btn btn-secondary" @click="customClear">清空</button>
        <button class="btn btn-secondary" @click="handleLoadExample">示例</button>
        <button class="btn btn-secondary" @click="copy">{{ copyText }}</button>
        <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
          自动 {{ autoMode ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="tool-section">
        <div class="tool-panel">
          <h3>原文</h3>
          <textarea v-model="carrier" class="textarea" placeholder="输入要装饰的文本..." rows="10"></textarea>
        </div>
        <div class="tool-panel">
          <h3>装饰结果</h3>
          <textarea v-model="output" class="textarea" placeholder="装饰结果..." rows="10" readonly></textarea>
          <button class="btn btn-sm" @click="copy" style="align-self: flex-start">{{ copyText }}</button>
        </div>
      </div>
    </template>

    <!-- Hide mode -->
    <template v-if="mode === 'hide'">
      <div class="tool-actions">
        <button class="btn" @click="process">隐藏</button>
        <button class="btn btn-secondary" @click="customClear">清空</button>
        <button class="btn btn-secondary" @click="handleLoadExample">示例</button>
        <button class="btn btn-secondary" @click="copy">{{ copyText }}</button>
        <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
          自动 {{ autoMode ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="tool-section" style="flex-direction: column; gap: 16px;">
        <div class="tool-panel">
          <h3>载体文本（公开可见）</h3>
          <textarea v-model="carrier" class="textarea" placeholder="输入公开文本..." rows="6"></textarea>
        </div>
        <div class="tool-panel">
          <h3>秘密信息</h3>
          <textarea v-model="secret" class="textarea" placeholder="输入要隐藏的信息..." rows="4"></textarea>
        </div>
        <div class="tool-panel">
          <h3>携带隐藏信息的文本</h3>
          <textarea v-model="output" class="textarea" placeholder="隐藏结果..." rows="6" readonly></textarea>
          <button class="btn btn-sm" @click="copy" style="align-self: flex-start">{{ copyText }}</button>
        </div>
      </div>
    </template>

    <!-- Extract mode -->
    <template v-if="mode === 'extract'">
      <div class="tool-actions">
        <button class="btn" @click="process">提取</button>
        <button class="btn btn-secondary" @click="customClear">清空</button>
        <button class="btn btn-secondary" @click="handleLoadExample">示例</button>
        <button class="btn btn-secondary" @click="pasteHidden">粘贴</button>
        <button class="btn btn-secondary" @click="copy">{{ copyText }}</button>
        <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
          自动 {{ autoMode ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="tool-section">
        <div class="tool-panel">
          <h3>携带隐藏信息的文本</h3>
          <textarea v-model="hiddenInput" class="textarea" placeholder="粘贴携带隐藏信息的文本..." rows="14"></textarea>
          <div v-if="hasHiddenData(hiddenInput)" class="hint">检测到零宽字符，可点击“提取”。</div>
        </div>
        <div class="tool-panel">
          <h3>提取结果</h3>
          <textarea v-model="output" class="textarea" placeholder="提取出的秘密信息..." rows="14" readonly></textarea>
          <button class="btn btn-sm" @click="copy" style="align-self: flex-start">{{ copyText }}</button>
        </div>
      </div>
    </template>

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
.template-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.hint {
  margin-top: 8px;
  font-size: 13px;
  color: var(--accent);
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
