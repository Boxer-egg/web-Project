import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: {
        title: '在线工具箱 - 20+ 款纯前端实用工具',
        description: '提供开发、文本、转换、效率、健康、驾考等 20+ 款纯前端实用工具。无需后端，数据仅在浏览器本地处理。'
      }
    },
    {
      path: '/tools/json-formatter',
      name: 'json-formatter',
      component: () => import('../views/tools/JsonFormatter.vue'),
      meta: {
        title: 'JSON 格式化 - 在线压缩、转义、美化工具',
        description: '在线 JSON 格式化工具，支持格式化、压缩、转义和去转义。粘贴 JSON 即可自动美化，支持 AI 自动化调用。',
        apiPath: '/api/json-format'
      }
    },
    {
      path: '/tools/base64',
      name: 'base64',
      component: () => import('../views/tools/Base64Converter.vue'),
      meta: {
        title: 'Base64 编解码 - 在线文本与文件转换工具',
        description: '在线 Base64 编解码工具，支持文本与 Base64 相互转换，支持文件上传转换为 Base64 DataURL。',
        apiPath: '/api/base64'
      }
    },
    {
      path: '/tools/url-encoder',
      name: 'url-encoder',
      component: () => import('../views/tools/UrlEncoder.vue'),
      meta: {
        title: 'URL 编解码 - 在线编码解码与参数解析工具',
        description: '在线 URL 编解码工具，支持自动识别编码/解码，自动解析 URL 查询参数为表格。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/regex',
      name: 'regex',
      component: () => import('../views/tools/RegexTester.vue'),
      meta: {
        title: '正则表达式测试 - 在线匹配与替换工具',
        description: '在线正则表达式测试工具，实时匹配高亮、分组提取、替换预览，内置常用正则预设。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/timestamp',
      name: 'timestamp',
      component: () => import('../views/tools/TimestampConverter.vue'),
      meta: {
        title: '时间戳转换 - Unix 时间戳与日期互转工具',
        description: '在线时间戳转换工具，支持 Unix 时间戳（秒/毫秒）与日期互转，输出 ISO、本地、友好格式。',
        apiPath: '/api/timestamp'
      }
    },
    {
      path: '/tools/color',
      name: 'color',
      component: () => import('../views/tools/ColorConverter.vue'),
      meta: {
        title: '颜色转换器 - HEX / RGB / HSL 互转工具',
        description: '在线颜色转换工具，支持 HEX、RGB、HSL、HSV 等格式互转，实时预览颜色。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/markdown',
      name: 'markdown',
      component: () => import('../views/tools/MarkdownPreview.vue'),
      meta: {
        title: 'Markdown 预览 - 在线编辑器与 HTML 导出工具',
        description: '在线 Markdown 预览工具，实时渲染 Markdown 为 HTML，支持分屏/编辑/预览模式，可导出为独立 HTML 文件。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/text-diff',
      name: 'text-diff',
      component: () => import('../views/tools/TextDiff.vue'),
      meta: {
        title: '文本差异对比 - 在线 Diff 工具',
        description: '在线文本差异对比工具，支持行级和字符级差异高亮，直观展示两段文本的不同之处。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/code-formatter',
      name: 'code-formatter',
      component: () => import('../views/tools/CodeFormatter.vue'),
      meta: {
        title: '代码格式化 - JS / CSS / HTML / JSON 美化工具',
        description: '在线代码格式化工具，支持 JavaScript、CSS、HTML、JSON 的美化与压缩，自动统计字符变化。',
        apiPath: '/api/code-format'
      }
    },
    {
      path: '/tools/password',
      name: 'password',
      component: () => import('../views/tools/PasswordGenerator.vue'),
      meta: {
        title: '密码生成器 - 安全随机密码生成工具',
        description: '在线密码生成器，使用加密安全随机数生成强密码，支持自定义长度、字符集、排除易混淆字符。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/jwt-decoder',
      name: 'jwt-decoder',
      component: () => import('../views/tools/JwtDecoder.vue'),
      meta: {
        title: 'JWT 解码器 - Token 解析与过期检测工具',
        description: '在线 JWT 解码器，解析 JWT Token 的 Header、Payload 和 Signature，自动检测 Token 是否过期。',
        apiPath: '/api/jwt-decode'
      }
    },
    {
      path: '/tools/uuid-generator',
      name: 'uuid-generator',
      component: () => import('../views/tools/UuidGenerator.vue'),
      meta: {
        title: 'UUID 生成器 - 批量生成 UUID v4 工具',
        description: '在线 UUID 生成器，批量生成 UUID v4，支持标准格式、无横线、大写、带引号、数组等多种输出格式。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/hash-calculator',
      name: 'hash-calculator',
      component: () => import('../views/tools/HashCalculator.vue'),
      meta: {
        title: 'Hash 计算器 - MD5 / SHA1 / SHA256 / SHA512 在线计算',
        description: '在线 Hash 计算器，支持 MD5、SHA1、SHA256、SHA512 算法，支持文本和文件 Hash 计算。',
        apiPath: '/api/hash'
      }
    },
    {
      path: '/tools/html-entity',
      name: 'html-entity',
      component: () => import('../views/tools/HtmlEntity.vue'),
      meta: {
        title: 'HTML 实体编解码 - 特殊字符转换工具',
        description: '在线 HTML 实体编解码工具，支持命名实体、十进制、十六进制编码，以及实体解码。',
        apiPath: '/api/html-entity'
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
        description: '在线进制转换工具，支持二进制、八进制、十进制、十六进制、三十六进制互转，自动检测前缀。',
        apiPath: '/api/number-convert'
      }
    },
    {
      path: '/tools/json-csv',
      name: 'json-csv',
      component: () => import('../views/tools/JsonCsvConverter.vue'),
      meta: {
        title: 'JSON CSV 转换 - 在线 JSON 数组与 CSV 互转工具',
        description: '在线 JSON 与 CSV 转换工具，支持 JSON 数组转 CSV、CSV 转 JSON，支持自定义分隔符和表头。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/qrcode',
      name: 'qrcode',
      component: () => import('../views/tools/QrcodeGenerator.vue'),
      meta: {
        title: '二维码生成器 - 文本/URL 转二维码图片工具',
        description: '在线二维码生成器，将文本、URL 等内容转换为可扫描的二维码图片，支持自定义颜色和尺寸。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/css-unit',
      name: 'css-unit',
      component: () => import('../views/tools/CssUnitConverter.vue'),
      meta: {
        title: 'CSS 单位转换 - PX / REM / EM / VH / VW 在线转换',
        description: '在线 CSS 单位转换工具，支持 PX、REM、EM、VH、VW、百分比等单位互转，基于根字体大小自动计算。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/lorem-ipsum',
      name: 'lorem-ipsum',
      component: () => import('../views/tools/LoremIpsum.vue'),
      meta: {
        title: 'Lorem Ipsum 生成器 - 假文占位文本生成工具',
        description: '在线 Lorem Ipsum 假文生成器，支持拉丁语和中文占位文本，可自定义段落数和每段句数。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/word-counter',
      name: 'word-counter',
      component: () => import('../views/tools/WordCounter.vue'),
      meta: {
        title: '字数统计 - 在线中文字数与阅读时间工具',
        description: '在线字数统计工具，实时统计中文字数、英文单词数、字符数、段落数，并预估阅读时间。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/unit-converter',
      name: 'unit-converter',
      component: () => import('../views/tools/UnitConverter.vue'),
      meta: {
        title: '单位换算 - 在线长度重量温度体积换算工具',
        description: '在线单位换算工具，支持长度、重量、面积、体积、温度、数据存储等多种单位的互转。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/bmi',
      name: 'bmi',
      component: () => import('../views/tools/BmiCalculator.vue'),
      meta: {
        title: 'BMI 计算器 - 在线身体质量指数计算工具',
        description: '在线 BMI 计算器，根据身高体重计算身体质量指数，按照中国成人标准给出分类和健康建议。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/chinese-converter',
      name: 'chinese-converter',
      component: () => import('../views/tools/ChineseConverter.vue'),
      meta: {
        title: '简繁体转换 - 在线简体中文与繁体中文互转工具',
        description: '在线简繁体转换工具，支持约 2000 个常用汉字的简体与繁体中文互相转换。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/date-calculator',
      name: 'date-calculator',
      component: () => import('../views/tools/DateCalculator.vue'),
      meta: {
        title: '日期计算器 - 在线日期间隔与日期加减工具',
        description: '在线日期计算器，支持计算两个日期之间的间隔天数，以及对指定日期进行加减天数计算。',
        apiPath: '/api/tool'
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
      path: '/tools/timer',
      name: 'timer',
      component: () => import('../views/tools/Timer.vue'),
      meta: {
        title: '专业计时器 - 倒计时/正计时/时钟/节目单',
        description: '专业舞台计时器，支持倒计时、正计时、时钟模式，节目单串联计时，颜色分级预警，全屏显示，快捷键操控。'
      }
    },
    {
      path: '/driving/license-study',
      name: 'driving-license-study',
      component: () => import('../views/tools/DrivingLicenseStudy.vue'),
      meta: {
        title: '科目一系统学习 - 驾考理论知识',
        description: '系统学习 C1/C2 科目一理论知识，按章节逐步掌握交通标志、通行规则、驾驶证规定和安全驾驶要点。'
      }
    },
    {
      path: '/driving/quiz',
      name: 'driving-license-quiz',
      component: () => import('../views/tools/DrivingLicenseQuiz.vue'),
      meta: {
        title: '驾考刷题 - C1/C2 科目一模拟考试',
        description: '在线驾考刷题工具，支持顺序练习、随机抽题、模拟考试和错题本，C1/C2 科目一题库离线可用。'
      }
    },
    {
      path: '/driving/traffic-signs',
      name: 'traffic-signs',
      component: () => import('../views/tools/TrafficSignGallery.vue'),
      meta: {
        title: '交通标志图库 - 驾考理论知识',
        description: '深圳交警与 GB 5768 道路交通标志图库，支持分类筛选、搜索和查看详情。'
      }
    },
    {
      path: '/driving/jk',
      name: 'jk',
      component: () => import('../views/tools/JsyksKms4View.vue'),
      meta: {
        title: '科目四顺序练习 - 驾考刷题',
        description: '驾校一点通 2026 科目四顺序练习题库，共 1550 题，支持分页浏览和答案查看。'
      }
    },
    {
      path: '/tools/led-marquee',
      name: 'led-marquee',
      component: () => import('../views/tools/LedMarquee.vue'),
      meta: {
        title: '手持 LED 弹幕 - 全屏滚动文字灯牌',
        description: '手持 LED 弹幕工具，模拟手机灯牌效果，支持自定义文字、颜色、速度、方向和字体大小，可全屏展示。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/image-canvas',
      name: 'image-canvas',
      component: () => import('../views/tools/ImageCanvasToolbox.vue'),
      meta: {
        title: '图片 Canvas 工具箱 - 像素化/水印/九宫格/格式转换',
        description: '在线图片处理工具箱，支持像素化、灰度/黑白、文字水印、压缩缩放、九宫格切割、格式转换等操作。'
      }
    },
    {
      path: '/tools/calculator',
      name: 'calculator',
      component: () => import('../views/tools/Calculator.vue'),
      meta: {
        title: '计算器 - 安全表达式计算工具',
        description: '在线安全计算器，支持 + - * / ^ % 和括号运算，支持键盘输入和历史记录。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/restaurant-profit',
      name: 'restaurant-profit',
      component: () => import('../views/tools/RestaurantProfitCalculator.vue'),
      meta: {
        title: '餐饮盈利计算器',
        description: '餐饮店盈利测算工具，支持商区类型、营业月数、建店成本、固定成本和毛利率计算盈亏平衡点、保本单数、翻台率和回本周期。'
      }
    },
    {
      path: '/tools/random-generator',
      name: 'random-generator',
      component: () => import('../views/tools/RandomGenerator.vue'),
      meta: {
        title: '随机生成器 - 随机数/字符串/UUID/颜色生成工具',
        description: '在线随机生成器，支持生成随机整数、小数、字符串、UUID 和颜色，使用加密安全随机数。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/yaml-json',
      name: 'yaml-json',
      component: () => import('../views/tools/YamlJsonConverter.vue'),
      meta: {
        title: 'YAML/JSON 互转 - 在线 YAML 与 JSON 转换工具',
        description: '在线 YAML 与 JSON 双向转换工具，支持格式化、压缩和语法错误提示。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/number-chinese',
      name: 'number-chinese',
      component: () => import('../views/tools/NumberToChinese.vue'),
      meta: {
        title: '数字大小写转换 - 中文大写金额/小写/人民币格式',
        description: '在线数字大小写转换工具，支持中文大写金额、中文小写读法和人民币格式。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/zip-plate-area',
      name: 'zip-plate-area',
      component: () => import('../views/tools/ZipPlateAreaQuery.vue'),
      meta: {
        title: '邮编/车牌/区号查询 - 离线行政区划查询工具',
        description: '在线查询邮编、车牌归属地、电话区号，纯前端静态数据，无需联网。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/garbage-classification',
      name: 'garbage-classification',
      component: () => import('../views/tools/GarbageClassification.vue'),
      meta: {
        title: '垃圾分类查询 - 常见垃圾分类与投放提示',
        description: '在线垃圾分类查询工具，输入常见垃圾名称即可查看所属分类和投放说明。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/shelf-life',
      name: 'shelf-life',
      component: () => import('../views/tools/ShelfLifeCalculator.vue'),
      meta: {
        title: '保质期计算 - 生产日期与过期日期换算工具',
        description: '在线保质期计算器，根据生产日期和保质期长度计算过期日期与剩余天数，支持天/月/年单位。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/blood-type',
      name: 'blood-type',
      component: () => import('../views/tools/BloodTypeInheritance.vue'),
      meta: {
        title: '血型遗传规律 - 父母血型推算子女血型概率',
        description: '在线血型遗传规律计算器，根据父母 ABO 与 Rh 血型推算子女可能出现的血型及概率。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/relationship',
      name: 'relationship',
      component: () => import('../views/tools/RelationshipCalculator.vue'),
      meta: {
        title: '亲戚关系计算 - 关系链与称谓互查',
        description: '在线亲戚关系计算器，支持关系链查称谓与称谓反查关系链。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/pinyin',
      name: 'pinyin',
      component: () => import('../views/tools/PinyinConverter.vue'),
      meta: {
        title: '文字转拼音 - 在线拼音转换工具',
        description: '在线文字转拼音工具，支持带声调、无声调、首字母三种模式，支持分词和保留非中文字符。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/hanzi-info',
      name: 'hanzi-info',
      component: () => import('../views/tools/HanziInfo.vue'),
      meta: {
        title: '汉字信息 - 拼音/笔画/部首/结构/释义',
        description: '在线查询单个汉字的拼音、笔画数、部首、结构和释义。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/martian-text',
      name: 'martian-text',
      component: () => import('../views/tools/MartianText.vue'),
      meta: {
        title: '火星文翻译器 - 中文与火星文互转',
        description: '在线火星文翻译器，支持普通中文与火星文互相转换。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/hello-world',
      name: 'hello-world',
      component: () => import('../views/tools/HelloWorldSnippets.vue'),
      meta: {
        title: 'Hello World - 各编程语言代码片段',
        description: '常见编程语言的 Hello World 代码片段，支持一键复制。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/text-art',
      name: 'text-art',
      component: () => import('../views/tools/TextArtSteganography.vue'),
      meta: {
        title: '文本颜艺/文字隐写 - 颜文字装饰与零宽隐写',
        description: '在线文本颜艺装饰和零宽字符文字隐写工具。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/svg-editor',
      name: 'svg-editor',
      component: () => import('../views/tools/SvgEditor.vue'),
      meta: {
        title: 'SVG 编辑器 - 在线 SVG 代码编辑与预览工具',
        description: '在线 SVG 编辑器，支持代码编辑、实时预览、插入基础图形、格式化和压缩，支持 AI 自动化调用。',
        apiPath: '/api/svg-editor'
      }
    },
    {
      path: '/tools/cron',
      name: 'cron',
      component: () => import('../views/tools/CronTool.vue'),
      meta: {
        title: 'Cron 表达式解析 - 在线 Cron 生成与验证工具',
        description: '在线 Cron 表达式解析工具，支持 UNIX、Quartz、Spring 方言，支持生成 Cron 表达式和查看最近执行时间，支持 AI 自动化调用。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/tools/css-minifier',
      name: 'css-minifier',
      component: () => import('../views/tools/CssMinifier.vue'),
      meta: {
        title: 'CSS 压缩 - 在线 CSS 代码压缩与优化工具',
        description: '在线 CSS 压缩工具，支持删除注释空白、简化颜色值、简化零值单位、移除空规则等优化选项，支持 AI 自动化调用。',
        apiPath: '/api/tool'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: Home,
      meta: {
        title: '页面未找到 - 在线工具箱',
        description: '页面不存在，返回在线工具箱首页浏览 20+ 款在线工具。'
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
