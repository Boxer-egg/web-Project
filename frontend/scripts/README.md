# 前端 E2E 测试

提供两层测试策略：

1. **`e2e-smoke.mjs`**：快速冒烟测试，验证核心工具的功能正确性（带断言）
2. **`e2e-visual.mjs`**：完整视觉测试，覆盖所有工具并生成 HTML 画廊供 AI 视觉检查

两个脚本都使用 [Playwright](https://playwright.dev/) 无头浏览器。

## 前置条件

Playwright **没有**写入 `package.json`，避免污染项目依赖。测试前需要临时安装：

```bash
# 安装 Playwright 本体（不写入 package.json）
npm install --no-save playwright

# 安装 Chromium 浏览器二进制（只需执行一次）
npx playwright install chromium
```

测试结束后可以卸载：

```bash
npm uninstall playwright
```

## 运行方式

### 快速冒烟测试（核心工具功能验证）

```bash
# 验证已部署的站点
BASE_URL=https://80695aa4.dev-web-tools.pages.dev npm run test:e2e

# 验证本地开发服务器
BASE_URL=http://localhost:5173 npm run test:e2e

# 自定义截图目录
SCREENSHOT_DIR=/tmp/my-shots BASE_URL=https://xxx.dev-web-tools.pages.dev npm run test:e2e
```

### 完整视觉测试（所有工具截图 + HTML 画廊）

```bash
# 验证已部署的站点
BASE_URL=https://80695aa4.dev-web-tools.pages.dev node scripts/e2e-visual.mjs

# 验证本地开发服务器
BASE_URL=http://localhost:5173 node scripts/e2e-visual.mjs

# 自定义截图目录
SCREENSHOT_DIR=/tmp/visual-shots BASE_URL=http://localhost:5173 node scripts/e2e-visual.mjs

# 可见浏览器模式（调试用）
HEADLESS=false BASE_URL=http://localhost:5173 node scripts/e2e-visual.mjs
```

## 输出

### e2e-smoke.mjs（快速冒烟测试）

- 控制台：每个用例的通过状态和实际输出 JSON
- 截图：`/tmp/tool-e2e-screenshots/<name>.png`
- 报告：`/tmp/tool-e2e-screenshots/results.json`

### e2e-visual.mjs（完整视觉测试）

- 控制台：每个工具的加载状态和进度
- 截图：`/tmp/tool-e2e-visual/<name>.png`（所有 47 个工具）
- JSON 报告：`/tmp/tool-e2e-visual/results.json`
- **HTML 画廊**：`/tmp/tool-e2e-visual/gallery.html`（👈 用浏览器打开，或用 Read 工具读取让 AI 检查截图）

## 新增工具测试用例

### 快速冒烟测试（e2e-smoke.mjs）

在 `scripts/e2e-smoke.mjs` 的 `cases` 数组中添加一项：

```javascript
{
  name: 'my-new-tool',
  path: '/tools/my-new-tool?input=hello&auto=1',
  expected: 'expected substring',
  getOutput: (page) => page.locator('.tool-section .tool-panel').nth(1).locator('textarea').inputValue()
}
```

如果默认的「输出包含 expected」断言不够，可以加上自定义 `assert`：

```javascript
assert: (output, expected) => output.includes(expected) && output.length > expected.length
```

### 完整视觉测试（e2e-visual.mjs）

**无需手动添加**！脚本会自动从 `router/index.js` 提取所有工具路由，新增工具会自动被测试。

## 常用输出区域选择器

| 工具类型 | 推荐选择器 |
|---------|-----------|
| 左右双栏 textarea | `page.locator('.tool-section .tool-panel').nth(1).locator('textarea')` |
| 代码高亮块 | `page.locator('.code-block code')` |
| 结果卡片 | `page.locator('.result-card .value').first()` |
| 大字展示 | `page.locator('.char-display')` |

## AI 自测工作流（推荐）

当 AI 完成代码修改后，按以下流程自测：

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 运行完整视觉测试

```bash
BASE_URL=http://localhost:5173 node scripts/e2e-visual.mjs
```

### 3. AI 检查 HTML 画廊

AI 使用 Read 工具读取生成的 HTML 报告，查看所有截图：

```bash
# AI 执行
Read /tmp/tool-e2e-visual/gallery.html
```

AI 会用视觉能力逐个检查：
- ✓ 布局是否正常
- ✓ 功能是否工作
- ✓ 样式是否符合预期
- ✓ 是否有明显的 bug

### 4. 可选：快速冒烟测试

如果改动涉及核心工具，运行快速冒烟测试验证功能正确性：

```bash
BASE_URL=http://localhost:5173 npm run test:e2e
```

## CI/自动化建议

在持续集成环境中，可以组合构建与测试：

```bash
npm run build
npx wrangler pages deploy dist
BASE_URL=https://YOUR_DEPLOY_URL.dev-web-tools.pages.dev npm run test:e2e
```
