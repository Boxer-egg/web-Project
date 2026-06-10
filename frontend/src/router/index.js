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
      meta: {
        title: '开发者工具箱 - 20+ 纯前端在线工具',
        description: '提供 JSON 格式化、Base64 编解码、正则测试、时间戳转换等 20+ 款纯前端在线工具。无需后端，数据仅在浏览器本地处理。'
      }
    },
    {
      path: '/tools/json-formatter',
      name: 'json-formatter',
      component: () => import('../views/tools/JsonFormatter.vue'),
      meta: {
        title: 'JSON 格式化 - 在线压缩、转义、美化工具',
        description: '在线 JSON 格式化工具，支持格式化、压缩、转义和去转义。粘贴 JSON 即可自动美化，支持 AI 自动化调用。'
      }
    },
    {
      path: '/tools/base64',
      name: 'base64',
      component: () => import('../views/tools/Base64Converter.vue'),
      meta: {
        title: 'Base64 编解码 - 在线文本与文件转换工具',
        description: '在线 Base64 编解码工具，支持文本与 Base64 相互转换，支持文件上传转换为 Base64 DataURL。'
      }
    },
    {
      path: '/tools/url-encoder',
      name: 'url-encoder',
      component: () => import('../views/tools/UrlEncoder.vue'),
      meta: {
        title: 'URL 编解码 - 在线编码解码与参数解析工具',
        description: '在线 URL 编解码工具，支持自动识别编码/解码，自动解析 URL 查询参数为表格。'
      }
    },
    {
      path: '/tools/regex',
      name: 'regex',
      component: () => import('../views/tools/RegexTester.vue'),
      meta: {
        title: '正则表达式测试 - 在线匹配与替换工具',
        description: '在线正则表达式测试工具，实时匹配高亮、分组提取、替换预览，内置常用正则预设。'
      }
    },
    {
      path: '/tools/timestamp',
      name: 'timestamp',
      component: () => import('../views/tools/TimestampConverter.vue'),
      meta: {
        title: '时间戳转换 - Unix 时间戳与日期互转工具',
        description: '在线时间戳转换工具，支持 Unix 时间戳（秒/毫秒）与日期互转，输出 ISO、本地、友好格式。'
      }
    },
    {
      path: '/tools/color',
      name: 'color',
      component: () => import('../views/tools/ColorConverter.vue'),
      meta: {
        title: '颜色转换器 - HEX / RGB / HSL 互转工具',
        description: '在线颜色转换工具，支持 HEX、RGB、HSL、HSV 等格式互转，实时预览颜色。'
      }
    },
    {
      path: '/tools/markdown',
      name: 'markdown',
      component: () => import('../views/tools/MarkdownPreview.vue'),
      meta: {
        title: 'Markdown 预览 - 在线编辑器与 HTML 导出工具',
        description: '在线 Markdown 预览工具，实时渲染 Markdown 为 HTML，支持分屏/编辑/预览模式，可导出为独立 HTML 文件。'
      }
    },
    {
      path: '/tools/text-diff',
      name: 'text-diff',
      component: () => import('../views/tools/TextDiff.vue'),
      meta: {
        title: '文本差异对比 - 在线 Diff 工具',
        description: '在线文本差异对比工具，支持行级和字符级差异高亮，直观展示两段文本的不同之处。'
      }
    },
    {
      path: '/tools/code-formatter',
      name: 'code-formatter',
      component: () => import('../views/tools/CodeFormatter.vue'),
      meta: {
        title: '代码格式化 - JS / CSS / HTML / JSON 美化工具',
        description: '在线代码格式化工具，支持 JavaScript、CSS、HTML、JSON 的美化与压缩，自动统计字符变化。'
      }
    },
    {
      path: '/tools/password',
      name: 'password',
      component: () => import('../views/tools/PasswordGenerator.vue'),
      meta: {
        title: '密码生成器 - 安全随机密码生成工具',
        description: '在线密码生成器，使用加密安全随机数生成强密码，支持自定义长度、字符集、排除易混淆字符。'
      }
    },
    {
      path: '/tools/jwt-decoder',
      name: 'jwt-decoder',
      component: () => import('../views/tools/JwtDecoder.vue'),
      meta: {
        title: 'JWT 解码器 - Token 解析与过期检测工具',
        description: '在线 JWT 解码器，解析 JWT Token 的 Header、Payload 和 Signature，自动检测 Token 是否过期。'
      }
    },
    {
      path: '/tools/uuid-generator',
      name: 'uuid-generator',
      component: () => import('../views/tools/UuidGenerator.vue'),
      meta: {
        title: 'UUID 生成器 - 批量生成 UUID v4 工具',
        description: '在线 UUID 生成器，批量生成 UUID v4，支持标准格式、无横线、大写、带引号、数组等多种输出格式。'
      }
    },
    {
      path: '/tools/hash-calculator',
      name: 'hash-calculator',
      component: () => import('../views/tools/HashCalculator.vue'),
      meta: {
        title: 'Hash 计算器 - MD5 / SHA1 / SHA256 / SHA512 在线计算',
        description: '在线 Hash 计算器，支持 MD5、SHA1、SHA256、SHA512 算法，支持文本和文件 Hash 计算。'
      }
    },
    {
      path: '/tools/html-entity',
      name: 'html-entity',
      component: () => import('../views/tools/HtmlEntity.vue'),
      meta: {
        title: 'HTML 实体编解码 - 特殊字符转换工具',
        description: '在线 HTML 实体编解码工具，支持命名实体、十进制、十六进制编码，以及实体解码。'
      }
    },
    {
      path: '/tools/text-toolbox',
      name: 'text-toolbox',
      component: () => import('../views/tools/TextToolbox.vue'),
      meta: {
        title: '文本处理工具箱 - 大小写/去重/排序/翻转等 16+ 功能',
        description: '在线文本处理工具箱，提供大小写转换、去除重复行、排序、翻转、统计等 16+ 种文本处理功能。'
      }
    },
    {
      path: '/tools/number-converter',
      name: 'number-converter',
      component: () => import('../views/tools/NumberConverter.vue'),
      meta: {
        title: '进制转换器 - 二/八/十/十六进制在线互转',
        description: '在线进制转换工具，支持二进制、八进制、十进制、十六进制、三十六进制互转，自动检测前缀。'
      }
    },
    {
      path: '/tools/json-csv',
      name: 'json-csv',
      component: () => import('../views/tools/JsonCsvConverter.vue'),
      meta: {
        title: 'JSON CSV 转换 - 在线 JSON 数组与 CSV 互转工具',
        description: '在线 JSON 与 CSV 转换工具，支持 JSON 数组转 CSV、CSV 转 JSON，支持自定义分隔符和表头。'
      }
    },
    {
      path: '/tools/qrcode',
      name: 'qrcode',
      component: () => import('../views/tools/QrcodeGenerator.vue'),
      meta: {
        title: '二维码生成器 - 文本/URL 转二维码图片工具',
        description: '在线二维码生成器，将文本、URL 等内容转换为可扫描的二维码图片，支持自定义颜色和尺寸。'
      }
    },
    {
      path: '/tools/css-unit',
      name: 'css-unit',
      component: () => import('../views/tools/CssUnitConverter.vue'),
      meta: {
        title: 'CSS 单位转换 - PX / REM / EM / VH / VW 在线转换',
        description: '在线 CSS 单位转换工具，支持 PX、REM、EM、VH、VW、百分比等单位互转，基于根字体大小自动计算。'
      }
    },
    {
      path: '/tools/lorem-ipsum',
      name: 'lorem-ipsum',
      component: () => import('../views/tools/LoremIpsum.vue'),
      meta: {
        title: 'Lorem Ipsum 生成器 - 假文占位文本生成工具',
        description: '在线 Lorem Ipsum 假文生成器，支持拉丁语和中文占位文本，可自定义段落数和每段句数。'
      }
    },
    {
      path: '/tools/word-counter',
      name: 'word-counter',
      component: () => import('../views/tools/WordCounter.vue'),
      meta: {
        title: '字数统计 - 在线中文字数与阅读时间工具',
        description: '在线字数统计工具，实时统计中文字数、英文单词数、字符数、段落数，并预估阅读时间。'
      }
    },
    {
      path: '/tools/unit-converter',
      name: 'unit-converter',
      component: () => import('../views/tools/UnitConverter.vue'),
      meta: {
        title: '单位换算 - 在线长度重量温度体积换算工具',
        description: '在线单位换算工具，支持长度、重量、面积、体积、温度、数据存储等多种单位的互转。'
      }
    },
    {
      path: '/tools/bmi',
      name: 'bmi',
      component: () => import('../views/tools/BmiCalculator.vue'),
      meta: {
        title: 'BMI 计算器 - 在线身体质量指数计算工具',
        description: '在线 BMI 计算器，根据身高体重计算身体质量指数，按照中国成人标准给出分类和健康建议。'
      }
    },
    {
      path: '/tools/chinese-converter',
      name: 'chinese-converter',
      component: () => import('../views/tools/ChineseConverter.vue'),
      meta: {
        title: '简繁体转换 - 在线简体中文与繁体中文互转工具',
        description: '在线简繁体转换工具，支持约 2000 个常用汉字的简体与繁体中文互相转换。'
      }
    },
    {
      path: '/tools/date-calculator',
      name: 'date-calculator',
      component: () => import('../views/tools/DateCalculator.vue'),
      meta: {
        title: '日期计算器 - 在线日期间隔与日期加减工具',
        description: '在线日期计算器，支持计算两个日期之间的间隔天数，以及对指定日期进行加减天数计算。'
      }
    },
    {
      path: '/tools/pomodoro',
      name: 'pomodoro',
      component: () => import('../views/tools/Pomodoro.vue'),
      meta: {
        title: '番茄钟 - 在线专注计时器',
        description: '在线番茄钟计时器，支持自定义专注和休息时长，圆形进度可视化，帮助提升工作学习效率。'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: Home,
      meta: {
        title: '页面未找到 - 开发者工具箱',
        description: '页面不存在，返回开发者工具箱首页浏览 20+ 款在线工具。'
      }
    },
  ],
})

// Update document title and meta description on route change
router.afterEach((to) => {
  const meta = to.meta
  if (meta.title) {
    document.title = meta.title
  }
  let descTag = document.querySelector('meta[name="description"]')
  if (meta.description) {
    if (!descTag) {
      descTag = document.createElement('meta')
      descTag.setAttribute('name', 'description')
      document.head.appendChild(descTag)
    }
    descTag.setAttribute('content', meta.description)
  }
})

export default router
