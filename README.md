# 开发者工具箱

纯前端在线工具集合，基于 Vue 3 + Vite 构建，无需后端服务器，所有计算均在浏览器本地完成。

## 在线访问

部署在 Cloudflare Pages 上：
https://your-site.pages.dev (请替换为实际地址)

## 功能列表（20个工具）

### 数据格式
| 工具 | 说明 |
|:---|:---|
| JSON 格式化 | 格式化、压缩、转义 JSON |
| Base64 编解码 | 文本与 Base64 互转，支持文件 |
| URL 编解码 | URL 编码/解码，自动解析参数 |
| HTML 实体编解码 | Named/Numeric/Hex 三种格式 |
| JSON ↔ CSV 转换 | JSON 数组与 CSV 互转 |

### 开发者工具
| 工具 | 说明 |
|:---|:---|
| 正则表达式测试 | 实时匹配、替换、分组提取 |
| JWT 解码器 | 解析 Token 的 Header/Payload/Signature |
| 时间戳转换 | 时间戳与日期互转 |
| Hash 计算器 | MD5/SHA1/SHA256/SHA512 |
| 进制转换器 | 2/8/10/16/36 进制互转 |
| CSS 单位转换 | PX/REM/EM/VH/VW/百分比互转 |
| 代码格式化 | JS/CSS/HTML/JSON 美化压缩 |

### 文本处理
| 工具 | 说明 |
|:---|:---|
| Markdown 预览 | 实时渲染，支持导出 HTML |
| 文本差异对比 | 行级/字符级差异高亮 |
| 文本处理工具箱 | 大小写/去重/排序/翻转等 16+ 功能 |
| Lorem Ipsum 生成器 | 拉丁语/中文假文 |

### 设计辅助
| 工具 | 说明 |
|:---|:---|
| 颜色转换器 | HEX/RGB/HSL 互转 |
| 二维码生成器 | 文本/URL 转二维码图片 |

### 安全/随机
| 工具 | 说明 |
|:---|:---|
| 密码生成器 | 随机密码，自定义规则 |
| UUID 生成器 | 批量生成 v4 UUID |

## AI 友好模式

每个工具支持通过 URL 参数自动执行：

```
https://your-site.com/#/tools/json-formatter?input={"a":1}&auto=1
https://your-site.com/#/tools/jwt-decoder?token=eyJhbG...&auto=1
https://your-site.com/#/tools/uuid-generator?count=10&auto=1
```

点击工具页面标题旁的 **"🤖 AI 调用"** 按钮可查看完整调用说明。

## 本地开发

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 构建部署

```bash
cd frontend
npm run build
```

构建产物输出在 `frontend/dist/` 目录。

### 部署到 Cloudflare Pages

项目使用 [wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI 部署：

```bash
# 首次使用需登录
npx wrangler login

# 部署（项目名：dev-web-tools）
npx wrangler pages deploy dist --project-name=dev-web-tools --branch=main
```

**SPA 刷新支持**：`public/_redirects` 已配置 `/* /index.html 200`，确保直接访问子路由（如 `/tools/jwt-decoder`）时由前端路由接管。

**自定义域名**：生产域名 `vvzzv.com` 在 Cloudflare Pages 控制台绑定。

## 技术栈

- Vue 3 + Composition API
- Vue Router (Hash 模式)
- Vite
- marked (Markdown 渲染)
- js-beautify (代码格式化)
- qrcode (二维码生成)
- @vueuse/core (本地存储等工具)

## 项目结构

```
web-Project/
├── frontend/               # Vue 3 项目
│   ├── src/
│   │   ├── components/     # 公共组件
│   │   │   ├── Sidebar.vue
│   │   │   └── AiHelpPanel.vue
│   │   ├── views/
│   │   │   ├── Home.vue    # 首页导航
│   │   │   └── tools/      # 20 个工具页面
│   │   ├── router/         # 路由配置
│   │   └── assets/         # 样式文件
│   └── dist/               # 构建产物（可部署）
├── 需求文档/               # 20 个工具的需求文档
└── README.md
```

## 浏览器支持

- Chrome / Edge / Firefox / Safari 最新版
- 支持移动端浏览器

## 许可

MIT
