<script setup>
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { useTool } from '../../composables/useTool'
import { useToast } from '../../composables/useToast'
import * as mdLogic from '../../logic/markdown'
import AiHelpPanel from '../../components/AiHelpPanel.vue'

const layout = useStorage('markdown-layout', 'split')
const toast = useToast()

const {
  input,
  output: html,
  clearAll,
  loadExample,
  copy: baseCopy
} = useTool({
  storageKey: 'markdown',
  processor: (val) => mdLogic.render(val),
  paramMapping: { text: { ref: ref('') } },
  example: `# 欢迎使用 Markdown 预览\n\n这是一个 **在线 Markdown 编辑器**，实时预览渲染效果。\n\n## 基础语法\n- **粗体**\n- *斜体*\n- \`代码\`\n\n\`\`\`javascript\nconsole.log('Hello World');\n\`\`\``
})

async function copyHtml() {
  await navigator.clipboard.writeText(html.value)
  toast.success('HTML 已复制')
}

function handleExport() {
  const full = mdLogic.exportHtml(html.value)
  const blob = new Blob([full], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'markdown.html'
  a.click()
  URL.revokeObjectURL(url)
  toast.success('已导出 HTML')
}
</script>

<template>
  <div class="tool-page">
    <div class="tool-header">
      <h1>📝 Markdown 预览</h1>
      <AiHelpPanel
        title="Markdown 预览"
        desc="实时渲染 Markdown 为 HTML，支持导出"
        api-tool="markdown"
        :params="[
          { name: 'text', desc: 'Markdown 文本', required: true, example: '# Hello World' },
          { name: 'auto', desc: '是否自动执行（填 1）', required: false, example: '1' }
        ]"
      />
    </div>
    <div class="tool-actions">
      <div class="layout-btns">
        <button class="btn btn-secondary" :class="{ active: layout === 'split' }" @click="layout = 'split'">分屏</button>
        <button class="btn btn-secondary" :class="{ active: layout === 'edit' }" @click="layout = 'edit'">编辑</button>
        <button class="btn btn-secondary" :class="{ active: layout === 'preview' }" @click="layout = 'preview'">预览</button>
      </div>
      <div class="op-btns">
        <button class="btn btn-secondary" @click="copyHtml">复制 HTML</button>
        <button class="btn btn-secondary" @click="handleExport">导出 HTML</button>
        <button class="btn btn-secondary" @click="clearAll">清空</button>
        <button class="btn btn-secondary" @click="loadExample">示例</button>
      </div>
    </div>
    <div class="editor-container" :class="layout">
      <div class="editor-pane" v-show="layout !== 'preview'">
        <textarea v-model="input" class="textarea main-editor" placeholder="输入 Markdown..." rows="25"></textarea>
      </div>
      <div class="preview-pane" v-show="layout !== 'edit'">
        <div class="markdown-body" v-html="html"></div>
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
.tool-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.layout-btns, .op-btns {
  display: flex;
  gap: 8px;
}
.active {
  background: var(--accent) !important;
  color: white !important;
}
.editor-container {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}
.editor-container.split {
  grid-template-columns: 1fr 1fr;
}
.editor-container.edit {
  grid-template-columns: 1fr;
}
.editor-container.preview {
  grid-template-columns: 1fr;
}
.editor-pane, .preview-pane {
  min-height: 500px;
}
.main-editor {
  height: 100%;
  min-height: 600px;
}
.preview-pane {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  overflow-y: auto;
}
/* Markdown Styles */
.markdown-body :deep(h1) { font-size: 24px; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 16px }
.markdown-body :deep(h2) { font-size: 20px; margin: 16px 0 12px }
.markdown-body :deep(h3) { font-size: 16px; margin: 14px 0 10px }
.markdown-body :deep(p) { margin-bottom: 12px }
.markdown-body :deep(ul, ol) { padding-left: 24px; margin-bottom: 12px }
.markdown-body :deep(li) { margin-bottom: 4px }
.markdown-body :deep(code) { background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: monospace; }
.markdown-body :deep(pre) { background: var(--bg-secondary); padding: 16px; border-radius: var(--radius); overflow: auto; margin-bottom: 12px }
.markdown-body :deep(pre code) { background: none; padding: 0 }
.markdown-body :deep(blockquote) { border-left: 4px solid var(--accent); padding-left: 16px; color: var(--text-secondary); margin: 12px 0 }
.markdown-body :deep(table) { width: 100%; border-collapse: collapse; margin-bottom: 12px }
.markdown-body :deep(th, td) { border: 1px solid var(--border); padding: 8px; text-align: left }
.markdown-body :deep(th) { background: var(--bg-secondary) }
.markdown-body :deep(a) { color: var(--accent) }

@media (max-width: 768px) {
  .editor-container.split {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
  .tool-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
