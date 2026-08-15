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
  { path: '/tools/image-canvas', name: '图片 Canvas 工具箱', icon: '🖌️', desc: '像素化、水印、九宫格切割、格式转换', category: '图像' },
  { path: '/tools/image-watermark', name: '图片水印生成器', icon: '💧', desc: '添加仅供指定用途使用的文字水印', category: '图像' },
  { path: '/tools/css-unit', name: 'CSS 单位转换', icon: '📐', desc: 'PX/REM/EM/VH/VW/百分比互转', category: '转换' },
  { path: '/tools/lorem-ipsum', name: 'Lorem Ipsum', icon: '📝', desc: '假文生成，拉丁语/中文占位文本', category: '文本' },
  { path: '/tools/word-counter', name: '字数统计', icon: '📝', desc: '实时统计中文字数、单词数、阅读时间', category: '文本' },
  { path: '/tools/unit-converter', name: '单位换算', icon: '📐', desc: '长度、重量、温度、面积、体积互转', category: '转换' },
  { path: '/tools/bmi', name: 'BMI 计算器', icon: '⚖️', desc: '身体质量指数计算与健康分类', category: '健康' },
  { path: '/tools/chinese-converter', name: '简繁体转换', icon: '🈷️', desc: '简体中文与繁体中文互相转换', category: '文本' },
  { path: '/tools/date-calculator', name: '日期计算器', icon: '📅', desc: '日期间隔计算与日期加减', category: '转换' },
  { path: '/tools/pomodoro', name: '番茄钟', icon: '🍅', desc: '专注计时器，自定义专注与休息时长', category: '效率' },
  { path: '/tools/timer', name: '专业计时器', icon: '⏱️', desc: '倒计时/正计时/时钟，节目单串联，舞台全屏', category: '效率' },
  { path: '/tools/led-marquee', name: '手持 LED 弹幕', icon: '📱', desc: '全屏滚动文字灯牌，自定义颜色速度方向', category: '效率' },
  { path: '/tools/relationship', name: '亲戚关系', icon: '👨‍👩‍👧‍👦', desc: '关系链查称谓、称谓反查关系链', category: '效率' },
  { path: '/tools/hello-world', name: 'Hello World', icon: '👋', desc: '各编程语言 Hello World 代码片段', category: '效率' },
  { path: '/tools/calculator', name: '计算器', icon: '🧮', desc: '安全表达式计算，支持键盘与历史记录', category: '转换' },
  { path: '/tools/random-generator', name: '随机生成器', icon: '🎲', desc: '随机整数、小数、字符串、UUID、颜色', category: '安全' },
  { path: '/tools/yaml-json', name: 'YAML ↔ JSON', icon: '🔄', desc: 'YAML 与 JSON 双向转换，支持紧凑输出', category: '开发' },
  { path: '/tools/number-chinese', name: '数字转中文', icon: '🔢', desc: '中文大写金额、小写读法、人民币格式', category: '文本' },
  { path: '/tools/pinyin', name: '文字转拼音', icon: '🔤', desc: '中文转拼音，支持声调/首字母/分词', category: '文本' },
  { path: '/tools/hanzi-info', name: '汉字信息', icon: '📖', desc: '查询汉字的拼音、笔画、部首和释义', category: '文本' },
  { path: '/tools/martian-text', name: '火星文翻译', icon: '👽', desc: '中文与火星文互相转换', category: '文本' },
  { path: '/tools/text-art', name: '文本颜艺', icon: '🎭', desc: '颜文字装饰与零宽字符文字隐写', category: '文本' },
  { path: '/tools/zip-plate-area', name: '邮编/车牌/区号', icon: '📮', desc: '离线查询邮编、车牌归属地、电话区号', category: '转换' },
  { path: '/tools/restaurant-profit', name: '餐饮盈利计算器', icon: '🍜', desc: '开店成本、盈亏平衡、回本周期测算', category: '商业' },
  { path: '/tools/rpr', name: '餐饮反向调研', icon: '🕵️‍♂️', desc: '通过单一数据反推竞品营收与翻台率', category: '商业' },
  { path: '/tools/garbage-classification', name: '垃圾分类', icon: '♻️', desc: '常见生活垃圾所属分类与投放提示', category: '健康' },
  { path: '/tools/blood-type', name: '血型遗传', icon: '🩸', desc: '根据父母血型推算子女可能血型及概率', category: '健康' },
  { path: '/tools/shelf-life', name: '保质期计算', icon: '🥫', desc: '根据生产日期和保质期计算过期日期', category: '转换' },
  { path: '/driving/quiz', name: '驾考刷题', icon: '🚗', desc: '科目一/科目四 顺序/随机/模拟考试/错题本', category: '驾考' },
  { path: '/driving/traffic-signs', name: '交通标志图库', icon: '🚦', desc: '分类浏览交通标志与说明', category: '驾考' },
  { path: '/tools/ball-x-pit', name: 'BALL x PIT 合成表', icon: '🎱', desc: '弹珠合成路线，点击展开下一级进化', category: '游戏' },
  { path: '/tools/ball-x-pit-passives', name: 'BALL x PIT 道具合成', icon: '🧪', desc: '被动道具合成配方，查询合成与参与合成', category: '游戏' },
]

const categories = [
  {
    key: 'text',
    name: '文本处理',
    icon: '📝',
    desc: '文本清洗、统计、简繁转换、假文生成、拼音、火星文',
    paths: [
      '/tools/text-toolbox',
      '/tools/word-counter',
      '/tools/chinese-converter',
      '/tools/lorem-ipsum',
      '/tools/number-chinese',
      '/tools/pinyin',
      '/tools/hanzi-info',
      '/tools/martian-text',
      '/tools/text-art',
    ]
  },
  {
    key: 'business',
    name: '商业测算',
    icon: '📊',
    desc: '餐饮盈利测算与竞品反向调研工具',
    paths: [
      '/tools/restaurant-profit',
      '/tools/rpr',
    ]
  },
  {
    key: 'convert',
    name: '转换计算',
    icon: '🔢',
    desc: '时间戳、颜色、单位、进制、日期换算',
    paths: [
      '/tools/timestamp',
      '/tools/color',
      '/tools/unit-converter',
      '/tools/date-calculator',
      '/tools/calculator',
      '/tools/zip-plate-area',
      '/tools/shelf-life',
    ]
  },
  {
    key: 'dev',
    name: '开发工具',
    icon: '💻',
    desc: 'JSON、编码、正则、Hash、JWT 等常用开发辅助',
    paths: [
      '/tools/json-formatter',
      '/tools/base64',
      '/tools/url-encoder',
      '/tools/regex',
      '/tools/code-formatter',
      '/tools/jwt-decoder',
      '/tools/uuid-generator',
      '/tools/hash-calculator',
      '/tools/html-entity',
      '/tools/number-converter',
      '/tools/json-csv',
      '/tools/yaml-json',
      '/tools/css-unit',
      '/tools/markdown',
      '/tools/text-diff',
    ]
  },
  {
    key: 'image',
    name: '图像分享',
    icon: '🖼️',
    desc: '二维码生成与图像相关工具',
    paths: ['/tools/qrcode', '/tools/image-canvas', '/tools/image-watermark']
  },
  {
    key: 'security',
    name: '安全工具',
    icon: '🔐',
    desc: '密码生成等安全相关工具',
    paths: ['/tools/password', '/tools/random-generator']
  },
  {
    key: 'productivity',
    name: '效率生活',
    icon: '⏱️',
    desc: '番茄钟、计时器、亲戚关系、Hello World',
    paths: ['/tools/pomodoro', '/tools/timer', '/tools/led-marquee', '/tools/relationship', '/tools/hello-world']
  },
  {
    key: 'health',
    name: '健康生活',
    icon: '⚖️',
    desc: 'BMI 计算与健康相关工具',
    paths: ['/tools/bmi', '/tools/garbage-classification', '/tools/blood-type']
  },
  {
    key: 'driving',
    name: '驾考学习',
    icon: '🚗',
    desc: '科目一/科目四刷题、模拟考试、错题本、交通标志图库',
    paths: [
      '/driving/quiz',
      '/driving/traffic-signs',
    ]
  },
  {
    key: 'game',
    name: '游戏辅助',
    icon: '🎮',
    desc: 'BALL x PIT 等游戏数据查询与合成工具',
    paths: [
      '/tools/ball-x-pit',
      '/tools/ball-x-pit-passives',
    ]
  },
]

function toolsFor(paths) {
  return tools.filter(t => paths.includes(t.path))
}

function goToTool(path) {
  router.push(path)
}

function goToCategory(path) {
  const firstTool = toolsFor(categories.find(c => c.key === path)?.paths || [])[0]
  if (firstTool) router.push(firstTool.path)
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
        <div class="category-card" @click="goToCategory(category.key)">
          <span class="category-icon" aria-hidden="true">{{ category.icon }}</span>
          <div class="category-info">
            <h2 class="category-name">{{ category.name }}</h2>
            <p class="category-desc">{{ category.desc }}</p>
          </div>
          <span class="category-count">{{ toolsFor(category.paths).length }} 个工具</span>
        </div>

        <div class="tool-grid">
          <article
            v-for="tool in toolsFor(category.paths)"
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
