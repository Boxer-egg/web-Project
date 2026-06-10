import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { title: '首页' }
    },
    {
      path: '/tools/json-formatter',
      name: 'json-formatter',
      component: () => import('../views/tools/JsonFormatter.vue'),
      meta: { title: 'JSON 格式化' }
    },
    {
      path: '/tools/base64',
      name: 'base64',
      component: () => import('../views/tools/Base64Converter.vue'),
      meta: { title: 'Base64 编解码' }
    },
    {
      path: '/tools/url-encoder',
      name: 'url-encoder',
      component: () => import('../views/tools/UrlEncoder.vue'),
      meta: { title: 'URL 编解码' }
    },
    {
      path: '/tools/regex',
      name: 'regex',
      component: () => import('../views/tools/RegexTester.vue'),
      meta: { title: '正则表达式测试' }
    },
    {
      path: '/tools/timestamp',
      name: 'timestamp',
      component: () => import('../views/tools/TimestampConverter.vue'),
      meta: { title: '时间戳转换' }
    },
    {
      path: '/tools/color',
      name: 'color',
      component: () => import('../views/tools/ColorConverter.vue'),
      meta: { title: '颜色转换器' }
    },
    {
      path: '/tools/markdown',
      name: 'markdown',
      component: () => import('../views/tools/MarkdownPreview.vue'),
      meta: { title: 'Markdown 预览' }
    },
    {
      path: '/tools/text-diff',
      name: 'text-diff',
      component: () => import('../views/tools/TextDiff.vue'),
      meta: { title: '文本差异对比' }
    },
    {
      path: '/tools/code-formatter',
      name: 'code-formatter',
      component: () => import('../views/tools/CodeFormatter.vue'),
      meta: { title: '代码格式化' }
    },
    {
      path: '/tools/password',
      name: 'password',
      component: () => import('../views/tools/PasswordGenerator.vue'),
      meta: { title: '密码生成器' }
    },
    {
      path: '/tools/jwt-decoder',
      name: 'jwt-decoder',
      component: () => import('../views/tools/JwtDecoder.vue'),
      meta: { title: 'JWT 解码器' }
    },
    {
      path: '/tools/uuid-generator',
      name: 'uuid-generator',
      component: () => import('../views/tools/UuidGenerator.vue'),
      meta: { title: 'UUID 生成器' }
    },
    {
      path: '/tools/hash-calculator',
      name: 'hash-calculator',
      component: () => import('../views/tools/HashCalculator.vue'),
      meta: { title: 'Hash 计算器' }
    },
    {
      path: '/tools/html-entity',
      name: 'html-entity',
      component: () => import('../views/tools/HtmlEntity.vue'),
      meta: { title: 'HTML 实体编解码' }
    },
    {
      path: '/tools/text-toolbox',
      name: 'text-toolbox',
      component: () => import('../views/tools/TextToolbox.vue'),
      meta: { title: '文本处理工具箱' }
    },
    {
      path: '/tools/number-converter',
      name: 'number-converter',
      component: () => import('../views/tools/NumberConverter.vue'),
      meta: { title: '进制转换器' }
    },
    {
      path: '/tools/json-csv',
      name: 'json-csv',
      component: () => import('../views/tools/JsonCsvConverter.vue'),
      meta: { title: 'JSON ↔ CSV 转换' }
    },
    {
      path: '/tools/qrcode',
      name: 'qrcode',
      component: () => import('../views/tools/QrcodeGenerator.vue'),
      meta: { title: '二维码生成器' }
    },
    {
      path: '/tools/css-unit',
      name: 'css-unit',
      component: () => import('../views/tools/CssUnitConverter.vue'),
      meta: { title: 'CSS 单位转换' }
    },
    {
      path: '/tools/lorem-ipsum',
      name: 'lorem-ipsum',
      component: () => import('../views/tools/LoremIpsum.vue'),
      meta: { title: 'Lorem Ipsum 生成器' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: Home,
      meta: { title: '页面未找到' }
    },
  ],
})

export default router
