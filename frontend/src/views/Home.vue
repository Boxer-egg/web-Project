<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const tools = [
  { path: '/tools/json-formatter', name: 'JSON 格式化', icon: '📋', desc: '格式化、压缩、转义 JSON 数据', category: '开发' },
  { path: '/tools/base64', name: 'Base64 编解码', icon: '🔐', desc: '文本与 Base64 相互转换，支持文件', category: '编码' },
  { path: '/tools/url-encoder', name: 'URL 编解码', icon: '🔗', desc: 'URL 编码解码，自动解析参数', category: '编码' },
  { path: '/tools/regex', name: '正则表达式测试', icon: '🔍', desc: '实时匹配、替换、分组提取', category: '开发' },
  { path: '/tools/timestamp', name: '时间戳转换', icon: '⏰', desc: '时间戳与日期互转，多种格式', category: '转换' },
  { path: '/tools/color', name: '颜色转换器', icon: '🎨', desc: 'HEX / RGB / HSL 互转，实时预览', category: '转换' },
  { path: '/tools/markdown', name: 'Markdown 预览', icon: '📝', desc: '实时渲染 Markdown，导出 HTML', category: '文档' },
  { path: '/tools/text-diff', name: '文本差异对比', icon: '📊', desc: '行级/字符级差异高亮对比', category: '开发' },
  { path: '/tools/code-formatter', name: '代码格式化', icon: '💻', desc: 'JS / CSS / HTML / JSON 美化压缩', category: '开发' },
  { path: '/tools/password', name: '密码生成器', icon: '🔑', desc: '随机密码生成，自定义规则', category: '安全' },
  { path: '/tools/jwt-decoder', name: 'JWT 解码器', icon: '📜', desc: '解析 JWT Token 的 Header 和 Payload', category: '安全' },
  { path: '/tools/uuid-generator', name: 'UUID 生成器', icon: '🆔', desc: '批量生成 UUID v4，多种格式', category: '安全' },
  { path: '/tools/hash-calculator', name: 'Hash 计算器', icon: '#️⃣', desc: 'MD5 / SHA1 / SHA256 / SHA512 计算', category: '安全' },
  { path: '/tools/html-entity', name: 'HTML 实体编解码', icon: '🔤', desc: 'HTML 特殊字符编码/解码转换', category: '编码' },
  { path: '/tools/text-toolbox', name: '文本处理工具箱', icon: '🧰', desc: '大小写/去重/排序/翻转等 16+ 功能', category: '文本' },
  { path: '/tools/number-converter', name: '进制转换器', icon: '🔢', desc: '二/八/十/十六进制互转，支持浮点', category: '转换' },
  { path: '/tools/json-csv', name: 'JSON ↔ CSV 转换', icon: '📑', desc: 'JSON 数组与 CSV 格式互相转换', category: '转换' },
  { path: '/tools/qrcode', name: '二维码生成器', icon: '▣', desc: '文本/URL 转可扫描的二维码图片', category: '图像' },
  { path: '/tools/css-unit', name: 'CSS 单位转换', icon: '📐', desc: 'PX/REM/EM/VH/VW/百分比互转', category: '转换' },
  { path: '/tools/lorem-ipsum', name: 'Lorem Ipsum', icon: '📝', desc: '假文生成，拉丁语/中文占位文本', category: '文本' },
  { path: '/tools/word-counter', name: '字数统计', icon: '📝', desc: '实时统计中文字数、单词数、阅读时间', category: '文本' },
  { path: '/tools/unit-converter', name: '单位换算', icon: '📐', desc: '长度、重量、温度、面积、体积互转', category: '转换' },
  { path: '/tools/bmi', name: 'BMI 计算器', icon: '⚖️', desc: '身体质量指数计算与健康分类', category: '健康' },
  { path: '/tools/chinese-converter', name: '简繁体转换', icon: '🈷️', desc: '简体中文与繁体中文互相转换', category: '文本' },
  { path: '/tools/date-calculator', name: '日期计算器', icon: '📅', desc: '日期间隔计算与日期加减', category: '效率' },
  { path: '/tools/pomodoro', name: '番茄钟', icon: '🍅', desc: '专注计时器，自定义专注与休息时长', category: '效率' },
]

function goToTool(path) {
  router.push(path)
}
</script>

<template>
  <main class="home">
    <section class="hero">
      <h1>开发者工具箱</h1>
      <p class="hero-subtitle">20+ 款纯前端在线开发工具，无需后端，数据仅在浏览器本地处理</p>
      <p class="hero-desc">
        所有工具均在浏览器中运行，无需上传数据到服务器。
        支持 AI 自动化调用，通过 URL 参数即可触发工具执行。
      </p>
    </section>

    <section class="tools-section" aria-label="工具列表">
      <h2 class="section-title">全部工具</h2>
      <div class="tool-grid">
        <article
          v-for="tool in tools"
          :key="tool.path"
          class="tool-card"
          @click="goToTool(tool.path)"
        >
          <span class="tool-icon" aria-hidden="true">{{ tool.icon }}</span>
          <h3>{{ tool.name }}</h3>
          <p>{{ tool.desc }}</p>
          <span class="tool-category">{{ tool.category }}</span>
        </article>
      </div>
    </section>

    <section class="faq-section" aria-label="常见问题">
      <h2 class="section-title">常见问题</h2>
      <div class="faq-list">
        <details class="faq-item">
          <summary>开发者工具箱是什么？</summary>
          <p>开发者工具箱是一个纯前端的在线工具集合网站，提供 20 多款开发者常用的工具，如 JSON 格式化、Base64 编解码、正则表达式测试、时间戳转换等。所有工具都在浏览器本地运行，无需后端服务器。</p>
        </details>
        <details class="faq-item">
          <summary>使用这些工具需要注册或登录吗？</summary>
          <p>不需要。所有工具完全免费，无需注册、登录或提供任何个人信息。打开网页即可直接使用。</p>
        </details>
        <details class="faq-item">
          <summary>我的数据会被上传到服务器吗？</summary>
          <p>不会。开发者工具箱是纯前端应用，所有数据处理都在您的浏览器本地完成。代码不会将任何数据发送到远程服务器，您可以放心处理敏感信息。</p>
        </details>
        <details class="faq-item">
          <summary>支持 AI 自动化调用吗？</summary>
          <p>支持。每个工具都支持通过 URL 参数进行 AI 友好模式的调用。例如：<code>/#/tools/json-formatter?input={"a":1}&auto=1</code> 可以自动触发 JSON 格式化并展示结果。每个工具页面都提供了 AI 调用说明。</p>
        </details>
        <details class="faq-item">
          <summary>工具的输入数据会保存在本地吗？</summary>
          <p>会的，为了方便使用，工具的输入数据会保存在浏览器的 localStorage 中。这意味着刷新页面或下次访问时，您之前输入的内容仍然保留。如果希望清除数据，可以使用工具页面的"清空"按钮。</p>
        </details>
        <details class="faq-item">
          <summary>可以在手机或平板上使用吗？</summary>
          <p>可以。网站采用了响应式设计，在手机、平板和桌面电脑上都能正常使用。在移动设备上，侧边栏会自动适配为底部导航栏。</p>
        </details>
        <!-- TODO: 恢复此 FAQ 当有 GitHub 仓库后
        <details class="faq-item">
          <summary>如何报告 Bug 或建议新功能？</summary>
          <p>如果您发现了问题或有功能建议，可以通过项目的 GitHub 仓库提交 Issue。我们会定期查看并处理用户反馈。</p>
        </details>
        -->
      </div>
    </section>
  </main>
</template>

<style scoped>
.home {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
.hero {
  text-align: center;
  padding: 40px 20px;
}
.hero h1 {
  font-size: 36px;
  margin-bottom: 12px;
  color: var(--text-primary);
}
.hero-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
.hero-desc {
  font-size: 14px;
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}
.section-title {
  font-size: 20px;
  color: var(--text-primary);
  margin: 32px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  padding: 20px 0;
}
.tool-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow);
  position: relative;
}
.tool-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}
.tool-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 12px;
}
.tool-card h3 {
  font-size: 16px;
  margin-bottom: 6px;
  color: var(--text-primary);
}
.tool-card p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 8px;
}
.tool-category {
  font-size: 11px;
  color: var(--accent);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.faq-section {
  margin-top: 40px;
  padding-bottom: 40px;
}
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.faq-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 20px;
}
.faq-item summary {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.faq-item summary::before {
  content: '▸';
  color: var(--accent);
  transition: transform 0.2s;
}
.faq-item[open] summary::before {
  transform: rotate(90deg);
}
.faq-item p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-top: 12px;
  padding-left: 20px;
}
.faq-item code {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--accent);
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 28px;
  }
  .hero-subtitle {
    font-size: 15px;
  }
  .tool-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
  .tool-card {
    padding: 14px;
  }
  .tool-icon {
    font-size: 24px;
  }
  .faq-item {
    padding: 12px 16px;
  }
}
</style>
