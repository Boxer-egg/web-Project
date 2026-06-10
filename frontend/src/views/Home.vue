<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const tools = [
  { path: '/tools/json-formatter', name: 'JSON 格式化', icon: '📋', desc: '格式化、压缩、转义 JSON 数据' },
  { path: '/tools/base64', name: 'Base64 编解码', icon: '🔐', desc: '文本与 Base64 相互转换，支持文件' },
  { path: '/tools/url-encoder', name: 'URL 编解码', icon: '🔗', desc: 'URL 编码解码，自动解析参数' },
  { path: '/tools/regex', name: '正则表达式测试', icon: '🔍', desc: '实时匹配、替换、分组提取' },
  { path: '/tools/timestamp', name: '时间戳转换', icon: '⏰', desc: '时间戳与日期互转，多种格式' },
  { path: '/tools/color', name: '颜色转换器', icon: '🎨', desc: 'HEX / RGB / HSL 互转，实时预览' },
  { path: '/tools/markdown', name: 'Markdown 预览', icon: '📝', desc: '实时渲染 Markdown，导出 HTML' },
  { path: '/tools/text-diff', name: '文本差异对比', icon: '📊', desc: '行级/字符级差异高亮对比' },
  { path: '/tools/code-formatter', name: '代码格式化', icon: '💻', desc: 'JS / CSS / HTML / JSON 美化压缩' },
  { path: '/tools/password', name: '密码生成器', icon: '🔑', desc: '随机密码生成，自定义规则' },
  { path: '/tools/jwt-decoder', name: 'JWT 解码器', icon: '📜', desc: '解析 JWT Token 的 Header 和 Payload' },
  { path: '/tools/uuid-generator', name: 'UUID 生成器', icon: '🆔', desc: '批量生成 UUID v4，多种格式' },
  { path: '/tools/hash-calculator', name: 'Hash 计算器', icon: '#️⃣', desc: 'MD5 / SHA1 / SHA256 / SHA512 计算' },
  { path: '/tools/html-entity', name: 'HTML 实体编解码', icon: '🔤', desc: 'HTML 特殊字符编码/解码转换' },
  { path: '/tools/text-toolbox', name: '文本处理工具箱', icon: '🧰', desc: '大小写/去重/排序/翻转等 16+ 功能' },
  { path: '/tools/number-converter', name: '进制转换器', icon: '🔢', desc: '二/八/十/十六进制互转，支持浮点' },
  { path: '/tools/json-csv', name: 'JSON ↔ CSV 转换', icon: '📑', desc: 'JSON 数组与 CSV 格式互相转换' },
  { path: '/tools/qrcode', name: '二维码生成器', icon: '▣', desc: '文本/URL 转可扫描的二维码图片' },
  { path: '/tools/css-unit', name: 'CSS 单位转换', icon: '📐', desc: 'PX/REM/EM/VH/VW/百分比互转' },
  { path: '/tools/lorem-ipsum', name: 'Lorem Ipsum', icon: '📝', desc: '假文生成，拉丁语/中文占位文本' },
]

function goToTool(path) {
  router.push(path)
}
</script>

<template>
  <div class="home">
    <div class="hero">
      <h1>🧰 开发者工具箱</h1>
      <p>纯前端在线工具集合，无需后端，数据仅在本地处理</p>
    </div>
    <div class="tool-grid">
      <div
        v-for="tool in tools"
        :key="tool.path"
        class="tool-card"
        @click="goToTool(tool.path)"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <h3>{{ tool.name }}</h3>
        <p>{{ tool.desc }}</p>
      </div>
    </div>
  </div>
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
  font-size: 32px;
  margin-bottom: 12px;
  color: var(--text-primary);
}
.hero p {
  font-size: 16px;
  color: var(--text-secondary);
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
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 24px;
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
}
</style>
