<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
import * as beautify from 'js-beautify'

const language = useStorage('code-lang', 'javascript')
const indent = useStorage('code-indent', 2)
const input = useStorage('code-input-js', '')
const output = ref('')
const copyText = ref('复制结果')
const stats = ref({ before: 0, after: 0 })

const examples = {
  javascript: `function hello(name) {
  if (!name) {
    console.log('Hello World');
  } else {
    console.log('Hello ' + name);
  }
}

hello('Developer');`,
  css: `.container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
}`,
  html: `<!DOCTYPE html>
<html>
<head>
  <title>示例页面</title>
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
    <p>欢迎使用代码格式化工具</p>
  </div>
</body>
</html>`,
  json: `{
  "name": "示例项目",
  "version": "1.0.0",
  "dependencies": {
    "vue": "^3.0.0",
    "vite": "^5.0.0"
  },
  "dev": true
}`
}

onMounted(() => {
  // 首次访问时自动加载示例
  if (!input.value) {
    input.value = examples[language.value] || examples.javascript
  }
  format()
})

function format() {
  if (!input.value) return
  stats.value.before = input.value.length
  try {
    const opt = { indent_size: indent.value }
    if (language.value === 'javascript') {
      output.value = beautify.js_beautify(input.value, opt)
    } else if (language.value === 'css') {
      output.value = beautify.css_beautify(input.value, opt)
    } else if (language.value === 'html') {
      output.value = beautify.html_beautify(input.value, opt)
    } else if (language.value === 'json') {
      output.value = JSON.stringify(JSON.parse(input.value), null, indent.value)
    }
    stats.value.after = output.value.length
  } catch (e) {
    output.value = '格式化失败: ' + e.message
    stats.value.after = 0
  }
}

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
  } catch (e) {
    output.value = '压缩失败: ' + e.message
    stats.value.after = 0
  }
}

async function copy() {
  if (!output.value) return
  try {
    await navigator.clipboard.writeText(output.value)
    copyText.value = '已复制'
    setTimeout(() => copyText.value = '复制结果', 2000)
  } catch {
    copyText.value = '复制失败'
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
}

function loadExample() {
  input.value = examples[language.value] || examples.javascript
}

const compression = computed(() => {
  if (!stats.value.before || !stats.value.after) return 0
  return Math.round((1 - stats.value.after / stats.value.before) * 100)
})
</script>

<template>
  <div class="tool-page">
    <h1>💻 代码格式化</h1>
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
      <button class="btn btn-secondary" @click="loadExample">示例</button>
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
  </div>
</template>
