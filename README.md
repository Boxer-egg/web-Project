# 在线工具箱

一个免费、免登录的在线工具集合，包含 50+ 款实用工具，打开网页即可使用。

**在线访问：https://vvzzv.com**

首页支持按名称搜索，也可以按分类浏览。

## 工具分类

| 分类 | 可以做什么 |
| --- | --- |
| 开发工具 | JSON 格式化、Base64、URL 编解码、正则测试、JWT 解码、Hash 计算、代码格式化、YAML/JSON 互转等 |
| 文本处理 | 文本去重/排序、字数统计、简繁转换、拼音、汉字信息、火星文、Markdown 预览、文本对比等 |
| 转换计算 | 时间戳、颜色、单位、进制、日期换算，以及计算器、邮编/车牌/区号、保质期查询 |
| 商业测算 | 餐饮盈利计算器、菜单毛利率、毛利率计算、餐饮反向调研、门头编辑器 |
| 图像工具 | 二维码生成、图片水印、Canvas 工具箱（像素化、九宫格切割、格式转换） |
| 效率生活 | 番茄钟、专业计时器、LED 弹幕、亲戚关系计算、Hello World 代码片段 |
| 健康生活 | BMI 计算、血型遗传、垃圾分类 |
| 驾考学习 | 科目一/科目四顺序练习、随机练习、模拟考试、错题本、交通标志图库 |
| 游戏辅助 | BALL x PIT 弹珠合成表、被动道具合成表 |
| 安全工具 | 密码生成器、UUID 生成器、随机数/字符串生成器 |

## 特点

- **免费、免登录**：打开即用，不需要注册账号。
- **隐私友好**：工具数据默认在浏览器本地处理；除你主动使用云同步或发送反馈外，数据不会上传。
- **手机可用**：电脑、平板、手机浏览器都能正常使用。
- **分享方便**：部分工具支持生成带当前参数的分享链接，发给别人即可复现结果。

## 反馈

使用中遇到问题或有功能建议，可以点击页面右下角的 **💬** 按钮直接反馈。

## 许可

MIT

## 自行部署

本项目是 Vue 3 + Vite 的静态单页应用，动态能力只依赖 Cloudflare Pages Functions（`frontend/functions`）。不需要传统服务器；Cloudflare 侧只需要 **Pages**，云同步功能再额外绑定一个 **KV namespace**。没有使用 Workers AI、D1、R2 或 Durable Objects —— 页面里的“AI 调用”只是普通的 JSON HTTP 接口。

### 1. 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`（见 `frontend/package.json`）
- npm（仓库使用 `frontend/package-lock.json`）
- 一个 Cloudflare 账号；自定义域名可选，域名托管在 Cloudflare 时配置最简单

### 2. 本地构建

```bash
cd frontend
npm ci
npm run build
```

构建前会自动执行 `scripts/generate-routes-meta.mjs`，从 `src/router/index.js` 生成：

- `functions/_shared/routes-meta.json`：`functions/_middleware.js` 用它注入每页的 title/description/canonical/OG 和面包屑
- `public/sitemap.xml`：站点地图

构建产物在 `frontend/dist`。只预览前端可以运行 `npm run preview`。

### 3. 创建 Pages 项目

**Git 集成（推荐）**

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. 选择仓库，**Root directory** 填 `frontend`（必须这样填，Pages 才能在 `frontend/functions` 找到 Functions）
3. Build command 填 `npm run build`
4. Build output directory 填 `dist`
5. 如果构建镜像的 Node 版本不对，在环境变量里加 `NODE_VERSION=22`

**Wrangler 直接上传**

```bash
cd frontend
npx wrangler login
npx wrangler pages deploy dist --project-name=<你的项目名> --branch=main
```

`frontend/functions/` 会被自动识别并部署为 Pages Functions，不需要单独部署。

### 4. 绑定 KV（云同步需要）

只有 `/api/sync-data` 需要 KV。它用 `drv-` 开头的恢复码保存/读取/删除数据，单条上限 50 KB。没有绑定时该接口返回 500 `KV binding not configured`，其他工具不受影响。

1. Dashboard → Workers & Pages → KV → Create a namespace
2. 打开 Pages 项目 → Settings → Functions → KV namespace bindings → Add binding
3. **Variable name** 填 `USER_DATA`（代码里固定使用这个名字）
4. 选择刚创建的 namespace；Production 和 Preview 都建议绑定
5. 重新部署一次

也可以把绑定写进 `frontend/wrangler.toml`（添加后 Wrangler 文件会成为项目配置源，Dashboard 里对应字段会变成只读）：

```toml
name = "<你的项目名>"
pages_build_output_dir = "./dist"
compatibility_date = "2026-06-16"

[[kv_namespaces]]
binding = "USER_DATA"
id = "<KV_NAMESPACE_ID>"
```

`compatibility_date` 可以改成当前日期；如果本地 Wrangler/workerd 报 “newest date supported”，改成它支持的最大日期。KV ID 可以用 `npx wrangler kv namespace create USER_DATA` 创建后获得。

### 5. 自定义域名与 SEO

Pages 项目 → Custom domains → Set up a custom domain，按提示把域名指向 `<项目名>.pages.dev`。

项目里有多处写死 `https://vvzzv.com`。换域名时至少修改：

- `frontend/index.html`：`og:url`、`canonical`、JSON-LD 里的 `url` 和 `potentialAction.target`
- `frontend/functions/_middleware.js`：`SITE`（404 页、canonical、Open Graph、301 跳转都用它）
- `frontend/scripts/generate-routes-meta.mjs`：`SITE`（决定 sitemap 域名）
- `frontend/public/robots.txt`：`Sitemap:`
- `frontend/public/sitemap.xml`：不要手改，改完上面的 `SITE` 后重新 `npm run build`

`frontend/src/router/index.js` 的客户端 canonical 和从夯到拉排行榜的图片水印已经改为读取当前域名，不需要再改。

`functions/_middleware.js` 的行为：

- 按 `routes-meta.json` 给已知页面注入 SEO 信息
- 未知页面路径返回自定义 404（HTTP 404）
- `/tools/restaurant-profit-reverse` 301 到 `/tools/rpr`
- 静态资源和 `/api/*` 直接放行

`public/_redirects` 里的 `/* /index.html 200` 是 SPA 回退规则。生产 Pages 会正常处理；`wrangler pages dev` 会提示 “Infinite loop” 并在本地忽略它，这是 Wrangler 的已知限制，不影响线上。

### 6. 本地联调

前端 + Functions + 本地 KV：

```bash
cd frontend
npm run build
npx wrangler pages dev dist --port 8788 --kv USER_DATA --compatibility-date=2026-06-16
```

访问 `http://127.0.0.1:8788`。`--kv USER_DATA` 只创建本地 KV 模拟，不会写入线上 namespace。

只调前端页面时用：

```bash
npm run preview -- --port 4173
```

E2E 冒烟测试：

```bash
BASE_URL=http://127.0.0.1:4173 npm run test:e2e
```

### 7. 反馈表单

右下角 💬 反馈组件默认提交到 Formspree：`frontend/src/components/FeedbackWidget.vue` 里的 `ENDPOINT`。自部署时请替换成自己的 Formspree 表单地址，或删除该组件；否则反馈会发到原项目作者的表单。

### 8. 部署后检查

- 首页和任意工具页能打开，查看源码中的 title/description/canonical 是否对应当前页面
- `https://<域名>/sitemap.xml`、`https://<域名>/robots.txt` 可访问
- `https://<域名>/api/sync-data?code=drv-test` 返回 `{ "ok": true, "exists": false }`，说明 KV 绑定生效
- 任选一个工具页点“AI 调用”，复制示例 URL 打开，应返回 JSON
- 访问一个不存在的路径（如 `/tools/not-exist`）应返回自定义 404 页面
