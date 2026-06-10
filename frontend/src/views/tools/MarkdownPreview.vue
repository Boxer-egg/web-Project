<script setup>
import { ref, computed, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { marked } from 'marked'

const input = useStorage('markdown-input', `# 欢迎使用 Markdown 预览

这是一个 **在线 Markdown 编辑器**，左侧输入 Markdown 语法，右侧实时预览渲染效果。

## 基础语法

### 1. 文字样式

- **粗体文字**：用两个星号包裹
- *斜体文字*：用一个星号包裹
- ~~删除线~~：用两个波浪线包裹
- \`行内代码\`：用反引号包裹

### 2. 标题层级

# 一级标题（最大）
## 二级标题
### 三级标题
#### 四级标题

### 3. 列表

无序列表：
- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B
- 第三项

有序列表：
1. 打开编辑器
2. 输入 Markdown
3. 查看预览

### 4. 代码块

支持语法高亮的代码块：

\`\`\`javascript
// JavaScript 示例
function greet(name) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

greet('Developer');
\`\`\`

\`\`\`python
# Python 示例
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))  # 输出: 120
\`\`\`

### 5. 表格

| 功能 | 描述 | 支持情况 |
|------|------|---------|
| 标题 | 多级标题 | ✅ 支持 |
| 列表 | 有序/无序 | ✅ 支持 |
| 代码 | 语法高亮 | ✅ 支持 |
| 表格 | 对齐排版 | ✅ 支持 |
| 图片 | 网络图片 | ✅ 支持 |

### 6. 引用与分割线

> 这是一段引用文本。Markdown 是一种轻量级标记语言，它允许你使用易读易写的纯文本格式编写文档。
>
> -- 引用来源

---

### 7. 链接与图片

[访问 GitHub](https://github.com)

![Vue Logo](https://vuejs.org/images/logo.png)

### 8. 任务列表

- [x] 已完成：支持基础 Markdown 语法
- [x] 已完成：支持代码高亮
- [x] 已完成：支持表格渲染
- [ ] 待完成：导出 PDF 功能

---

> 💡 **提示**：点击上方「分屏/编辑/预览」按钮可以切换布局模式。使用「导出 HTML」可以将当前内容下载为独立网页。
`)
const layout = useStorage('markdown-layout', 'split')

const html = computed(() => {
  try {
    return marked(input.value, { breaks: true })
  } catch {
    return '<p>渲染错误</p>'
  }
})

function clearAll() {
  input.value = ''
}

function loadExample() {
  input.value = `# Markdown 示例

## 标题

# 一级标题
## 二级标题
### 三级标题

## 列表

- 无序列表项 1
- 无序列表项 2
  - 嵌套项

1. 有序列表项 1
2. 有序列表项 2

## 代码

行内代码: \`const x = 1\`

代码块:

\`\`\`python
def hello():
    print("Hello World")
\`\`\`

## 表格

| 语言 | 用途 |
|------|------|
| JavaScript | 前端 |
| Python | 后端 |

## 引用

> 这是一段引用文本。
>
> -- 作者
`
}

async function copyHtml() {
  try {
    await navigator.clipboard.writeText(html.value)
    alert('HTML 已复制')
  } catch {
    alert('复制失败')
  }
}

function exportHtml() {
  const full = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Markdown Export</title>
<style>
body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6}
code{background:#f4f4f4;padding:2px 6px;border-radius:3px}
pre{background:#f4f4f4;padding:16px;border-radius:6px;overflow:auto}
blockquote{border-left:4px solid #ddd;padding-left:16px;color:#666;margin:0}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f4f4f4}
</style>
</head>
<body>
${html.value}
</body>
</html>`
  const blob = new Blob([full], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'markdown.html'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="tool-page">
    <h1>📝 Markdown 预览</h1>
    <div class="tool-actions">
      <button class="btn btn-secondary" :class="{ active: layout === 'split' }" @click="layout = 'split'">分屏</button>
      <button class="btn btn-secondary" :class="{ active: layout === 'edit' }" @click="layout = 'edit'">编辑</button>
      <button class="btn btn-secondary" :class="{ active: layout === 'preview' }" @click="layout = 'preview'">预览</button>
      <button class="btn btn-secondary" @click="copyHtml">复制 HTML</button>
      <button class="btn btn-secondary" @click="exportHtml">导出 HTML</button>
      <button class="btn btn-secondary" @click="clearAll">清空</button>
      <button class="btn btn-secondary" @click="loadExample">示例</button>
    </div>
    <div class="editor-container" :class="layout">
      <div class="editor-pane" v-show="layout !== 'preview'">
        <textarea v-model="input" class="textarea" placeholder="输入 Markdown..." rows="25"></textarea>
      </div>
      <div class="preview-pane" v-show="layout !== 'edit'">
        <div class="markdown-body" v-html="html"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  display: grid;
  gap: 16px;
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
.preview-pane {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  overflow: auto;
}
.markdown-body :deep(h1) { font-size: 24px; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 16px }
.markdown-body :deep(h2) { font-size: 20px; margin: 16px 0 12px }
.markdown-body :deep(h3) { font-size: 16px; margin: 14px 0 10px }
.markdown-body :deep(p) { margin-bottom: 12px }
.markdown-body :deep(ul, ol) { padding-left: 24px; margin-bottom: 12px }
.markdown-body :deep(li) { margin-bottom: 4px }
.markdown-body :deep(code) { background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; font-size: 13px }
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
    grid-template-rows: 1fr 1fr;
  }
}
</style>
