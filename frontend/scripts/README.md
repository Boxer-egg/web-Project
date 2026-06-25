# 前端 E2E 冒烟测试

`scripts/e2e-smoke.mjs` 使用 [Playwright](https://playwright.dev/) 无头浏览器打开每个工具的 URL，验证 `auto=1` 参数能正确触发计算并输出结果。

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

### 1. 验证已部署的站点

```bash
BASE_URL=https://80695aa4.dev-web-tools.pages.dev npm run test:e2e
```

### 2. 验证本地开发服务器

```bash
# 终端 1
npm run dev

# 终端 2
BASE_URL=http://localhost:5173 npm run test:e2e
```

### 3. 自定义截图目录

```bash
SCREENSHOT_DIR=/tmp/my-shots BASE_URL=https://xxx.dev-web-tools.pages.dev npm run test:e2e
```

## 输出

- 控制台：每个用例的通过状态和实际输出 JSON。
- 截图：`/tmp/tool-e2e-screenshots/<name>.png`
- 报告：`/tmp/tool-e2e-screenshots/results.json`

## 新增工具测试用例

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

## 常用输出区域选择器

| 工具类型 | 推荐选择器 |
|---------|-----------|
| 左右双栏 textarea | `page.locator('.tool-section .tool-panel').nth(1).locator('textarea')` |
| 代码高亮块 | `page.locator('.code-block code')` |
| 结果卡片 | `page.locator('.result-card .value').first()` |
| 大字展示 | `page.locator('.char-display')` |

## CI/自动化建议

在持续集成环境中，可以组合构建与测试：

```bash
npm run build
npx wrangler pages deploy dist
BASE_URL=https://YOUR_DEPLOY_URL.dev-web-tools.pages.dev npm run test:e2e
```
