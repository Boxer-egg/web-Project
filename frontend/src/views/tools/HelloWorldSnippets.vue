<script setup>
import { ref, computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { LANGUAGES, findLanguage } from '../../logic/helloWorld'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const selectedKey = useStorage('hello-lang', 'javascript')
const lang = computed(() => findLanguage(selectedKey.value) || LANGUAGES[0])

function processor() {
  return lang.value.code
}

const {
  output,
  error,
  autoMode,
  copyText,
  loadExample,
  process,
  copy
} = useTool({
  storageKey: 'hello',
  processor,
  paramMapping: {
    lang: { ref: selectedKey }
  },
  example: ''
})

watch(selectedKey, () => {
  if (autoMode.value) process()
})

function handleLoadExample() {
  selectedKey.value = 'javascript'
  process()
}

function runCopy() {
  if (!output.value) return
  copy()
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>👋 Hello World</h1>
      <AiHelpPanel
        title="开发语言输出 hello world"
        desc="常见编程语言的 Hello World 代码片段，支持一键复制"
        api-tool="hello_world"
        :params="[
          { name: 'lang', desc: '语言名称或别名', required: false, example: 'python' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="card config-bar">
      <div class="config-row">
        <label class="select-label">选择语言：
          <select v-model="selectedKey" class="input">
            <option v-for="l in LANGUAGES" :key="l.key" :value="l.key">{{ l.name }}</option>
          </select>
        </label>
      </div>
    </div>

    <div class="tool-actions">
      <button class="btn" @click="process">生成代码</button>
      <button class="btn btn-secondary" @click="handleLoadExample">示例（JS）</button>
      <button class="btn btn-secondary" @click="runCopy">{{ copyText }}</button>
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>

    <div v-if="lang" class="card desc-card">
      <h3>{{ lang.name }}</h3>
      <p>{{ lang.description }}</p>
    </div>

    <div class="tool-panel">
      <h3>代码片段</h3>
      <textarea v-model="output" class="textarea code-area" placeholder="选择语言后生成代码..." rows="16" readonly></textarea>
      <button class="btn btn-sm" @click="runCopy" style="align-self: flex-start">{{ copyText }}</button>
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
.select-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}
.select-label select {
  min-width: 160px;
}
.desc-card {
  margin-bottom: 16px;
  padding: 16px;
}
.desc-card h3 {
  margin-bottom: 6px;
  color: var(--text-primary);
}
.desc-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}
.code-area {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
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
