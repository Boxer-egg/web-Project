<script setup>
import { ref, computed } from 'vue'
import DOMPurify from 'dompurify'
import { useTool } from '../../composables/useTool'
import { formatSvg, minifySvg, insertShape, getShapeTemplates } from '../../logic/svg'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const textareaRef = ref(null)
const cursorPos = ref(0)
const svgCode = ref('')

const {
  input: code,
  output,
  error,
  autoMode,
  copyText,
  clearAll,
  loadExample,
  process,
  copy
} = useTool({
  storageKey: 'svg-editor',
  customInput: svgCode,
  paramMapping: { svg: { ref: svgCode } },
  processor: (val) => val,
  example: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">\n  <rect x="20" y="20" width="160" height="160" fill="#3B82F6" />\n</svg>'
})

const previewSvg = computed(() => {
  if (error.value) return ''
  return DOMPurify.sanitize(code.value)
})

function updateCursor() {
  const el = textareaRef.value
  if (el) cursorPos.value = el.selectionStart
}

function insert(shape) {
  updateCursor()
  code.value = insertShape(code.value, shape, cursorPos.value)
}

function format() {
  try {
    code.value = formatSvg(code.value)
    error.value = ''
  } catch (e) {
    error.value = '格式化失败: ' + e.message
  }
}

function minify() {
  try {
    code.value = minifySvg(code.value)
    error.value = ''
  } catch (e) {
    error.value = '压缩失败: ' + e.message
  }
}

function download() {
  const blob = new Blob([code.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'image.svg'
  a.click()
  URL.revokeObjectURL(url)
}

const shapes = Object.keys(getShapeTemplates())
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>🎨 SVG 编辑器</h1>
      <AiHelpPanel
        title="SVG 编辑器"
        desc="在线 SVG 代码编辑与实时预览工具，支持插入基础图形、格式化和压缩"
        :params="[
          { name: 'svg', desc: 'SVG 源码', required: true, example: '<svg>...</svg>' },
          { name: 'action', desc: 'preview / format / minify', required: false, example: 'minify' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>

    <div class="tool-actions">
      <button v-for="shape in shapes" :key="shape" class="btn btn-sm btn-secondary" @click="insert(shape)">
        {{ shape }}
      </button>
    </div>

    <div class="tool-section svg-editor">
      <div class="tool-panel">
        <h3>代码</h3>
        <textarea
          ref="textareaRef"
          v-model="code"
          class="textarea code-area"
          rows="18"
          placeholder="在此输入 SVG 代码..."
          @keyup="updateCursor"
          @click="updateCursor"
        ></textarea>
      </div>
      <div class="tool-panel">
        <h3>预览</h3>
        <div class="svg-preview" v-html="previewSvg"></div>
        <div v-if="error" class="error-text">{{ error }}</div>
      </div>
    </div>

    <div class="tool-actions">
      <button class="btn" @click="format">格式化</button>
      <button class="btn" @click="minify">压缩</button>
      <button class="btn btn-secondary" @click="download">下载 SVG</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">加载示例</button>
      <button class="btn btn-secondary" @click="copy">{{ copyText }}</button>
      <button class="btn btn-sm" :class="autoMode ? '' : 'btn-secondary'" @click="autoMode = !autoMode" style="font-size:11px">
        自动 {{ autoMode ? 'ON' : 'OFF' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.svg-editor {
  min-height: 400px;
}
.code-area {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}
.svg-preview {
  flex: 1;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  padding: 12px;
  background: var(--bg-primary);
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.svg-preview :deep(svg) {
  max-width: 100%;
  max-height: 100%;
}
.error-text {
  margin-top: 8px;
  color: var(--danger);
  font-size: 13px;
}
</style>
