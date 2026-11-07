<script setup>
import { useRouter } from 'vue-router'
import { toolGroups } from '../data/toolGroups'

const router = useRouter()

const categories = toolGroups.map(group => ({
  key: group.key,
  name: group.title,
  icon: group.homeIcon,
  desc: group.homeDesc,
  tools: group.tools
}))

function goToTool(path) {
  router.push(path)
}

function goToCategory(category) {
  if (category.tools[0]) router.push(category.tools[0].path)
}
</script>

<template>
  <main class="home">
    <section class="hero">
      <h1>在线工具箱</h1>
      <p class="hero-subtitle">20+ 款纯前端实用工具，无需后端，数据仅在浏览器本地处理</p>
      <p class="hero-desc">
        所有工具均在浏览器中运行，无需上传数据到服务器。
        支持 AI 自动化调用，通过 URL 参数即可触发工具执行。
      </p>
    </section>

    <section class="tools-section" aria-label="工具列表">
      <div
        v-for="category in categories"
        :key="category.key"
        class="category-section"
      >
        <div class="category-card" @click="goToCategory(category)">
          <span class="category-icon" aria-hidden="true">{{ category.icon }}</span>
          <div class="category-info">
            <h2 class="category-name">{{ category.name }}</h2>
            <p class="category-desc">{{ category.desc }}</p>
          </div>
          <span class="category-count">{{ category.tools.length }} 个工具</span>
        </div>

        <div class="tool-grid">
          <article
            v-for="tool in category.tools"
            :key="tool.path"
            class="tool-card"
            @click="goToTool(tool.path)"
          >
            <span class="tool-icon" aria-hidden="true">{{ tool.icon }}</span>
            <h3>{{ tool.name }}</h3>
            <p>{{ tool.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="faq-section" aria-label="常见问题">
      <h2 class="section-title">常见问题</h2>
      <div class="faq-list">
        <details class="faq-item">
          <summary>在线工具箱是什么？</summary>
          <p>在线工具箱是一个纯前端的在线工具集合网站，提供 20 多款实用工具，如 JSON 格式化、Base64 编解码、正则表达式测试、二维码生成、BMI 计算、番茄钟、驾考学习等。所有工具都在浏览器本地运行，无需后端服务器。</p>
        </details>
        <details class="faq-item">
          <summary>使用这些工具需要注册或登录吗？</summary>
          <p>不需要。所有工具完全免费，无需注册、登录或提供任何个人信息。打开网页即可直接使用。</p>
        </details>
        <details class="faq-item">
          <summary>我的数据会被上传到服务器吗？</summary>
          <p>不会。在线工具箱是纯前端应用，所有数据处理都在您的浏览器本地完成。代码不会将任何数据发送到远程服务器，您可以放心处理敏感信息。</p>
        </details>
        <details class="faq-item">
          <summary>支持 AI 自动化调用吗？</summary>
          <p>支持。每个工具都支持通过 URL 参数进行 AI 友好模式的调用。例如：<code>/tools/json-formatter?input={"a":1}&auto=1</code> 可以自动触发 JSON 格式化并展示结果。每个工具页面都提供了 AI 调用说明。</p>
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
.tools-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.category-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.category-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.2s;
}
.category-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}
.category-icon {
  font-size: 32px;
  flex-shrink: 0;
}
.category-info {
  flex: 1;
  min-width: 0;
}
.category-name {
  font-size: 18px;
  margin-bottom: 4px;
  color: var(--text-primary);
}
.category-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}
.category-count {
  font-size: 13px;
  color: var(--accent);
  background: var(--bg-tertiary);
  padding: 4px 10px;
  border-radius: 12px;
  flex-shrink: 0;
}
.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding-left: 8px;
}
.tool-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
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
  font-size: 28px;
  display: block;
  margin-bottom: 10px;
}
.tool-card h3 {
  font-size: 15px;
  margin-bottom: 6px;
  color: var(--text-primary);
}
.tool-card p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0;
}

.faq-section {
  margin-top: 48px;
  padding-bottom: 40px;
}
.section-title {
  font-size: 20px;
  color: var(--text-primary);
  margin: 32px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
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
  .category-card {
    padding: 16px;
    gap: 12px;
  }
  .category-icon {
    font-size: 26px;
  }
  .category-name {
    font-size: 16px;
  }
  .category-desc {
    font-size: 13px;
  }
  .category-count {
    display: none;
  }
  .tool-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
    padding-left: 0;
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
