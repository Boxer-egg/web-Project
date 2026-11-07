/**
 * Canonical tool grouping shared by the sidebar and the homepage.
 *
 * Both surfaces render groups in the exact order defined here, so they can
 * never drift apart again. The sidebar uses `title` + tool
 * `path/name/icon/keywords`; the homepage additionally uses `homeIcon`,
 * `homeDesc` and each tool's `desc`.
 */
export const toolGroups = [
  {
    key: 'business',
    title: '商业测算',
    homeIcon: '📊',
    homeDesc: '餐饮盈利测算、竞品反向调研与门头招牌设计工具',
    tools: [
      { path: '/tools/restaurant-profit', name: '餐饮盈利计算器', icon: '🍜', desc: '开店成本、盈亏平衡、回本周期测算', keywords: ['canyin', 'restaurant', 'profit', 'yingli', 'jisuan', 'kaidian', 'kuiyin'] },
      { path: '/tools/menu-gross-margin', name: '菜单毛利率计算器', icon: '📋', desc: '单品原材料成本、套餐组合与整体菜单毛利率', keywords: ['caidan', 'menu', 'gross', 'margin', 'maolilv', 'taocan', 'chengpin', 'yuancailiao'] },
      { path: '/tools/gross-margin', name: '毛利率计算', icon: '💰', desc: '输入成本与售价，自动算毛利率', keywords: ['maolilv', 'gross', 'margin', 'chengben', 'shoujia', 'maoli', 'jisuan'] },
      { path: '/tools/rpr', name: '餐饮反向调研', icon: '🕵️‍♂️', desc: '通过单一数据反推竞品营收与翻台率', keywords: ['canyin', 'restaurant', 'reverse', 'fankui', 'diaoyan', 'jingpin', 'yingli', 'fanxuan'] },
      { path: '/tools/storefront-sign-editor', name: '门头编辑器', icon: '🏪', desc: '餐饮店铺招牌排版、对齐、间距与导出', keywords: ['mentou', 'storefront', 'sign', 'paibian', 'sheji', 'canyin'] },
    ]
  },
  {
    key: 'convert',
    title: '转换计算',
    homeIcon: '🔢',
    homeDesc: '时间戳、颜色、单位、进制、日期换算',
    tools: [
      { path: '/tools/timestamp', name: '时间戳转换', icon: '⏰', desc: '时间戳与日期互转，多种格式', keywords: ['shijianchuo', 'timestamp', 'date', 'unix', 'shijian'] },
      { path: '/tools/color', name: '颜色转换器', icon: '🎨', desc: 'HEX / RGB / HSL 互转，实时预览', keywords: ['yanse', 'color', 'hex', 'rgb', 'hsl', 'convert'] },
      { path: '/tools/unit-converter', name: '单位换算', icon: '📐', desc: '长度、重量、温度、面积、体积互转', keywords: ['danwei', 'unit', 'length', 'weight', 'temperature', 'huansuan'] },
      { path: '/tools/date-calculator', name: '日期计算', icon: '📅', desc: '日期间隔计算与日期加减', keywords: ['riqi', 'date', 'jisuan', 'days', 'tianshu'] },
      { path: '/tools/calculator', name: '计算器', icon: '🧮', desc: '安全表达式计算，支持键盘与历史记录', keywords: ['jisuanqi', 'calculator', 'compute', 'math'] },
      { path: '/tools/zip-plate-area', name: '邮编/车牌/区号', icon: '📮', desc: '离线查询邮编、车牌归属地、电话区号', keywords: ['youbian', 'chepai', 'quhao', 'zip', 'plate', 'area', 'postal'] },
      { path: '/tools/shelf-life', name: '保质期计算', icon: '🥫', desc: '根据生产日期和保质期计算过期日期', keywords: ['baozhiqi', 'shelf', 'life', 'guoqi', 'expiry', 'date'] },
    ]
  },
  {
    key: 'dev',
    title: '开发工具',
    homeIcon: '💻',
    homeDesc: 'JSON、编码、正则、Hash、JWT 等常用开发辅助',
    tools: [
      { path: '/tools/json-formatter', name: 'JSON 格式化', icon: '📋', desc: '格式化、压缩、转义 JSON 数据', keywords: ['json', 'geshihua', 'ge shi hua', 'format', 'meihua', 'yasuo', 'compress'] },
      { path: '/tools/base64', name: 'Base64 编解码', icon: '🔐', desc: '文本与 Base64 相互转换，支持文件', keywords: ['base64', 'bianjiema', 'bian ma', 'jie ma', 'encode', 'decode'] },
      { path: '/tools/url-encoder', name: 'URL 编解码', icon: '🔗', desc: 'URL 编码解码，自动解析参数', keywords: ['url', 'bianjiema', 'encode', 'decode', 'percent', 'escape'] },
      { path: '/tools/regex', name: '正则测试', icon: '🔍', desc: '实时匹配、替换、分组提取', keywords: ['zhengze', 'regular', 'regex', 'regexp', 'test', 'pipei'] },
      { path: '/tools/code-formatter', name: '代码格式化', icon: '💻', desc: 'JS / CSS / HTML / JSON 美化压缩', keywords: ['code', 'daima', 'format', 'beautify', 'javascript', 'css', 'html'] },
      { path: '/tools/css-minifier', name: 'CSS 压缩', icon: '🗜️', desc: '删除注释空白、简化颜色值、简化零值单位等多种优化', keywords: ['css', 'yasuo', 'minify', 'compress', 'youhua'] },
      { path: '/tools/jwt-decoder', name: 'JWT 解码器', icon: '📜', desc: '解析 JWT Token 的 Header 和 Payload', keywords: ['jwt', 'jiema', 'decode', 'token', 'verify'] },
      { path: '/tools/uuid-generator', name: 'UUID 生成器', icon: '🆔', desc: '批量生成 UUID v4，多种格式', keywords: ['uuid', 'shengcheng', 'guid', 'generate', 'unique'] },
      { path: '/tools/hash-calculator', name: 'Hash 计算器', icon: '#️⃣', desc: 'MD5 / SHA1 / SHA256 / SHA512 计算', keywords: ['hash', 'md5', 'sha', 'jisuan', 'digest'] },
      { path: '/tools/html-entity', name: 'HTML 实体', icon: '🔤', desc: 'HTML 特殊字符编码/解码转换', keywords: ['html', 'shiti', 'entity', 'encode', 'decode'] },
      { path: '/tools/number-converter', name: '进制转换', icon: '🔢', desc: '二/八/十/十六进制互转，支持浮点', keywords: ['jinzhi', 'jin zhi', 'binary', 'hex', 'octal', 'decimal', 'radix'] },
      { path: '/tools/json-csv', name: 'JSON↔CSV', icon: '📑', desc: 'JSON 数组与 CSV 格式互相转换', keywords: ['json', 'csv', 'convert', 'zhuanhuan', 'excel'] },
      { path: '/tools/css-unit', name: 'CSS单位', icon: '📐', desc: 'PX/REM/EM/VH/VW/百分比互转', keywords: ['css', 'danwei', 'unit', 'px', 'rem', 'em', 'vh', 'vw'] },
      { path: '/tools/markdown', name: 'Markdown 预览', icon: '📝', desc: '实时渲染 Markdown，导出 HTML', keywords: ['markdown', 'yulan', 'preview', 'md'] },
      { path: '/tools/svg-editor', name: 'SVG 编辑器', icon: '🎨', desc: 'SVG 代码编辑与实时预览，支持格式化压缩', keywords: ['svg', 'bianji', 'editor', 'yulan', 'tuxing', 'vector'] },
      { path: '/tools/text-diff', name: '文本差异对比', icon: '📊', desc: '行级/字符级差异高亮对比', keywords: ['wenben', 'text', 'chayi', 'diff', 'compare', 'duibi'] },
      { path: '/tools/yaml-json', name: 'YAML ↔ JSON', icon: '🔄', desc: 'YAML 与 JSON 双向转换，支持紧凑输出', keywords: ['yaml', 'json', 'zhuanhuan', 'convert', 'jiaoHU'] },
      { path: '/tools/cron', name: 'Cron 表达式', icon: '⏰', desc: '解析、生成和验证 Cron 表达式，支持 UNIX / Quartz / Spring 方言', keywords: ['cron', 'biaodashi', 'expression', 'dingshi', 'schedule', 'crontab'] },
    ]
  },
  {
    key: 'image',
    title: '图像分享',
    homeIcon: '🖼️',
    homeDesc: '二维码生成与图像相关工具',
    tools: [
      { path: '/tools/qrcode', name: '二维码', icon: '▣', desc: '文本/URL 转可扫描的二维码图片', keywords: ['erweima', 'qrcode', 'barcode', 'scan', 'shengcheng'] },
      { path: '/tools/image-canvas', name: '图片 Canvas 工具箱', icon: '🖌️', desc: '像素化、水印、九宫格切割、格式转换', keywords: ['tupian', 'image', 'canvas', 'xiangsu', 'shuiyin', 'jiugongge', 'filter'] },
      { path: '/tools/image-watermark', name: '图片水印生成器', icon: '💧', desc: '添加仅供指定用途使用的文字水印', keywords: ['tupian', 'image', 'shuiyin', 'watermark', 'shenhe', 'shengcheng'] },
    ]
  },
  {
    key: 'security',
    title: '安全工具',
    homeIcon: '🔐',
    homeDesc: '密码生成等安全相关工具',
    tools: [
      { path: '/tools/password', name: '密码生成器', icon: '🔑', desc: '随机密码生成，自定义规则', keywords: ['mima', 'password', 'suiji', 'random', 'generate'] },
      { path: '/tools/random-generator', name: '随机生成器', icon: '🎲', desc: '随机整数、小数、字符串、UUID、颜色', keywords: ['suiji', 'random', 'uuid', 'color', 'number', 'shengcheng'] },
    ]
  },
  {
    key: 'productivity',
    title: '效率生活',
    homeIcon: '⏱️',
    homeDesc: '番茄钟、计时器、亲戚关系、Hello World',
    tools: [
      { path: '/tools/pomodoro', name: '番茄钟', icon: '🍅', desc: '专注计时器，自定义专注与休息时长', keywords: ['fanqie', 'pomodoro', 'timer', 'zhong', 'jishi'] },
      { path: '/tools/timer', name: '专业计时器', icon: '⏱️', desc: '倒计时/正计时/时钟，节目单串联，舞台全屏', keywords: ['jishi', 'timer', 'stopwatch', 'countdown', 'daojishi'] },
      { path: '/tools/led-marquee', name: '手持 LED 弹幕', icon: '📱', desc: '全屏滚动文字灯牌，自定义颜色速度方向', keywords: ['shouchi', 'led', 'danmu', 'marquee', 'dengpai'] },
      { path: '/tools/relationship', name: '亲戚关系', icon: '👨‍👩‍👧‍👦', desc: '关系链查称谓、称谓反查关系链', keywords: ['qinqi', 'relationship', 'qishu', 'chenghu', 'jiacheng'] },
      { path: '/tools/hello-world', name: 'Hello World', icon: '👋', desc: '各编程语言 Hello World 代码片段', keywords: ['hello', 'world', 'chengxu', 'yuyan', 'daima', 'fuzhi'] },
    ]
  },
  {
    key: 'fun',
    title: '趣味工具',
    homeIcon: '🏆',
    homeDesc: '从夯到拉排行榜梗图生成',
    tools: [
      { path: '/tools/hang-la', name: '从夯到拉', icon: '🏆', desc: '拖拽图片或文字卡片生成夯拉排行榜梗图', keywords: ['hang', 'la', 'tier', 'rank', 'paihang', 'paiming', 'hangla', 'chengdu'] },
    ]
  },
  {
    key: 'game',
    title: '游戏辅助',
    homeIcon: '🎮',
    homeDesc: 'BALL x PIT 等游戏数据查询与合成工具',
    tools: [
      { path: '/tools/ball-x-pit', name: 'BALL x PIT 合成表', icon: '🎱', desc: '弹珠合成路线，点击展开下一级进化', keywords: ['ball', 'pit', 'hecheng', '合成', 'danzu', 'evolve', 'game'] },
      { path: '/tools/ball-x-pit-passives', name: 'BALL x PIT 道具合成', icon: '🧪', desc: '被动道具合成配方，查询合成与参与合成', keywords: ['ball', 'pit', 'daoju', 'passive', 'item', 'hecheng', 'game'] },
    ]
  },
  {
    key: 'health',
    title: '健康生活',
    homeIcon: '⚖️',
    homeDesc: 'BMI 计算与健康相关工具',
    tools: [
      { path: '/tools/bmi', name: 'BMI 计算', icon: '⚖️', desc: '身体质量指数计算与健康分类', keywords: ['bmi', 'shengao', 'tizhong', 'body', 'mass', 'index', 'jisuan'] },
      { path: '/tools/garbage-classification', name: '垃圾分类', icon: '♻️', desc: '常见生活垃圾所属分类与投放提示', keywords: ['laji', 'garbage', 'fenlei', 'recycle', 'huanbao'] },
      { path: '/tools/blood-type', name: '血型遗传', icon: '🩸', desc: '根据父母血型推算子女可能血型及概率', keywords: ['xuexing', 'blood', 'yichuan', 'inheritance', 'abo', 'rh'] },
    ]
  },
  {
    key: 'driving',
    title: '驾考学习',
    homeIcon: '🚗',
    homeDesc: '科目一/科目四刷题、模拟考试、错题本、交通标志图库',
    tools: [
      { path: '/driving/quiz', name: '驾考刷题', icon: '🚗', desc: '科目一/科目四 顺序/随机/模拟考试/错题本', keywords: ['shuati', 'quiz', 'exam', 'jiaxiao', 'moni'] },
      { path: '/driving/traffic-signs', name: '交通标志图库', icon: '🚦', desc: '分类浏览交通标志与说明', keywords: ['jiaotong', 'traffic', 'sign', 'biaozhi', 'tuku', 'tubiao'] },
    ]
  },
  {
    key: 'text',
    title: '文本处理',
    homeIcon: '📝',
    homeDesc: '文本清洗、统计、简繁转换、假文生成、拼音、火星文',
    tools: [
      { path: '/tools/text-toolbox', name: '文本工具箱', icon: '🧰', desc: '大小写/去重/排序/翻转等 16+ 功能', keywords: ['wenben', 'text', 'toolbox', 'daxiao', 'case', 'quchong', 'sort', 'fanzhuan', 'reverse'] },
      { path: '/tools/word-counter', name: '字数统计', icon: '📝', desc: '实时统计中文字数、单词数、阅读时间', keywords: ['zishu', 'word', 'count', 'tongji', 'character'] },
      { path: '/tools/chinese-converter', name: '简繁转换', icon: '🈷️', desc: '简体中文与繁体中文互相转换', keywords: ['jianfan', 'chinese', 'convert', 'simplified', 'traditional', 'fantizhongwen'] },
      { path: '/tools/lorem-ipsum', name: '假文生成', icon: '📝', desc: '假文生成，拉丁语/中文占位文本', keywords: ['jiawen', 'lorem', 'ipsum', 'dummy', 'placeholder', 'shengcheng'] },
      { path: '/tools/number-chinese', name: '数字转中文', icon: '🔢', desc: '中文大写金额、小写读法、人民币格式', keywords: ['shuzi', 'number', 'chinese', 'daxie', 'jine', 'renminbi', 'convert'] },
      { path: '/tools/pinyin', name: '文字转拼音', icon: '🔤', desc: '中文转拼音，支持声调/首字母/分词', keywords: ['pinyin', 'wenzi', 'zhuanpin', 'fayin', 'yinjie'] },
      { path: '/tools/hanzi-info', name: '汉字信息', icon: '📖', desc: '查询汉字的拼音、笔画、部首和释义', keywords: ['hanzi', 'bushou', 'pianpang', 'bihua', 'pinyin', 'fayin'] },
      { path: '/tools/martian-text', name: '火星文翻译', icon: '👽', desc: '中文与火星文互相转换', keywords: ['huoxingwen', 'martian', 'fanzhuan', 'wenzi'] },
      { path: '/tools/text-art', name: '文本颜艺', icon: '🎭', desc: '颜文字装饰与零宽字符文字隐写', keywords: ['wenben', 'text', 'yanyi', 'kaomoji', 'yincang', 'yinxie'] },
    ]
  }
]
