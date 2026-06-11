<script setup>
import { computed, ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import * as codeLogic from '../../logic/code-format'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const language = useStorage('code-lang', 'javascript')
const indent = useStorage('code-indent', 2)
const stats = ref({ before: 0, after: 0 })

const examples = {
  javascript: `function hello(name) {\n  if (!name) {\n    console.log('Hello World');\n  } else {\n    console.log('Hello ' + name);\n  }\n}\n\nhello('Developer');`,
  css: `.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  padding: 20px;\n  background: #ffffff;\n  border-radius: 8px;\n}`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>示例页面</title>\n</head>\n<body>\n  <div class="container">\n    <h1>Hello World</h1>\n    <p>欢迎使用代码格式化工具</p>\n  </div>\n</body>\n</html>`,
  json: `{\n  "name": "示例项目",\n  "version": "1.0.0",\n  "dependencies": {\n    "vue": "^3.0.0",\n    "vite": "^5.0.0"\n  },\n  "dev": true\n}`
}

const {
  input,
  output,
  error,
  autoMode,
  copyText,
  clearAll,
  loadExample,
  process: format,
  copy
} = useTool({
  storageKey: 'code',
  processor: (val) => {
    stats.value.before = val.length
    const res = codeLogic.format(val, language.value, indent.value)
    stats.value.after = res.length
    return res
  },
  paramMapping: { 
    code: { ref: ref('') },
    lang: { ref: language },
    indent: { ref: indent, transform: v => parseInt(v) }
  },
  example: examples.javascript
})

watch([language, indent], () => {
  if (autoMode.value) format()
})

function minify() {
  if (!input.value) return
  stats.value.before = input.value.length
  try {
    if (language.value === 'json') {
      output.value = JSON.stringify(JSON.parse(input.value))
    } else {
      output.value = input.value
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/\s+/g, ' ')
        .trim()
    }
    stats.value.after = output.value.length
    error.value = ''
  } catch (e) {
    error.value = '压缩失败: ' + e.message
  }
}

const compression = computed(() => {
  if (!stats.value.before || !stats.value.after) return 0
  return Math.round((1 - stats.value.after / stats.value.before) * 100)
})

function handleLoadExample() {
  input.value = examples[language.value] || examples.javascript
  format()
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>💻 代码格式化</h1>
      <AiHelpPanel
        title="代码格式化"
        desc="JavaScript/CSS/HTML/JSON 代码美化与压缩"
        :params="[
          { name: 'code', desc: '要格式化的代码', required: true, example: 'function hello(){console.log(1)}' },
          { name: 'lang', desc: '语言：javascript/css/html/json', required: false, example: 'javascript' },
          { name: 'indent', desc: '缩进空格数：2或4', required: false, example: '2' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-actions">
      <select v-model="language" class="input" style="width:auto">
        <option value="javascript">JavaScript</option>
        <option value="css">CSS</option>
        <option value="html">HTML</option>
        <option value="json">JSON</option>
      </select>
      <select v-model="indent" class="input" style="width:auto">
        <option :value="2">2 空格</option>
        <option :value="4">4 空格</option>
      </select>
      <button class="btn" @click="format">格式化</button>
      <button class="btn btn-secondary" @click="minify">压缩</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="handleLoadExample">示例</button>
    </div>
    <div class="tool-actions">
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>
    <div class="tool-section">
      <div class="tool-panel">
        <h3>输入</h3>
        <textarea v-model="input" class="textarea" placeholder="输入代码..." rows="18"></textarea>
      </div>
      <div class="tool-panel">
        <h3>输出
          <span v-if="stats.before" style="color:var(--text-muted);font-size:12px;margin-left:8px">
            {{ stats.before }} → {{ stats.after }} 字符
            <span v-if="compression > 0" style="color:var(--success)">(-{{ compression }}%)</span>
          </span>
        </h3>
        <textarea v-model="output" class="textarea" placeholder="处理结果..." rows="18" readonly></textarea>
        <button class="btn btn-sm" @click="copy" style="align-self:flex-start">{{ copyText }}</button>
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
.error-msg {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 10px 16px;
  border-radius: var(--radius);
  margin-top: 10px;
  font-size: 14px;
}
</style>
