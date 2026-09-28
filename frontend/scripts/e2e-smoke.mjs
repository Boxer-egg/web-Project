#!/usr/bin/env node
/**
 * E2E smoke tests for the online toolbox.
 *
 * Uses Playwright to open each tool page via URL parameters, waits for the
 * output area to populate, and asserts the result. Screenshots and a JSON
 * report are written to the screenshot directory.
 *
 * Usage:
 *   BASE_URL=https://xxx.dev-web-tools.pages.dev node scripts/e2e-smoke.mjs
 *   BASE_URL=http://localhost:5173 node scripts/e2e-smoke.mjs
 *   SCREENSHOT_DIR=/tmp/my-shots BASE_URL=... node scripts/e2e-smoke.mjs
 *
 * Exit code:
 *   0 - all cases passed
 *   1 - one or more cases failed
 */

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const BASE = process.env.BASE_URL
if (!BASE) {
  console.error('Error: BASE_URL is required.')
  console.error('')
  console.error('Examples:')
  console.error('  BASE_URL=https://xxx.dev-web-tools.pages.dev node scripts/e2e-smoke.mjs')
  console.error('  BASE_URL=http://localhost:5173 node scripts/e2e-smoke.mjs')
  process.exit(1)
}

const SCREENSHOTS = process.env.SCREENSHOT_DIR || '/tmp/tool-e2e-screenshots'

/**
 * Poll a getter until it returns a non-empty value or the timeout expires.
 * @param {import('playwright').Page} page
 * @param {(page: import('playwright').Page) => Promise<string>} getter
 * @param {{ timeout?: number, interval?: number }} options
 */
async function waitForOutput(page, getter, { timeout = 10000, interval = 200 } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const val = await getter(page)
    if (val && String(val).trim().length > 0) return val
    await page.waitForTimeout(interval)
  }
  return await getter(page)
}

/**
 * Test cases. Add a new entry here when a tool supports URL auto-execution.
 *
 * Fields:
 *   name          - short identifier used for the screenshot filename
 *   path          - route + query string to open
 *   expected      - substring expected in the output (or numeric string when assert is used)
 *   getOutput     - Playwright locator expression that extracts the output text.
 *                   Use .catch(() => '') for elements that appear asynchronously,
 *                   so waitForOutput keeps polling instead of failing immediately.
 *   assert        - (output, expected) => boolean, optional custom assertion
 */
const cases = [
  {
    name: 'pinyin',
    path: '/tools/pinyin?text=你好世界&tone=tone&segment=1&auto=1',
    expected: 'nǐ hǎo shì jiè',
    getOutput: (page) => page.locator('.tool-section .tool-panel').nth(1).locator('textarea').inputValue()
  },
  {
    name: 'hanzi-info',
    path: '/tools/hanzi-info?char=饕&auto=1',
    expected: 'tāo',
    getOutput: (page) => page.locator('.info-item .value').first().textContent()
  },
  {
    name: 'martian',
    path: '/tools/martian-text?text=我爱你，世界！&direction=toMartian&auto=1',
    expected: '莪嗳伱，丗堺！',
    getOutput: (page) => page.locator('.tool-section .tool-panel').nth(1).locator('textarea').inputValue()
  },
  {
    name: 'hello-world',
    path: '/tools/hello-world?lang=python&auto=1',
    expected: "print('Hello, World!')",
    getOutput: (page) => page.locator('.code-block code').textContent()
  },
  {
    name: 'text-art',
    path: '/tools/text-art?mode=decorate&text=你好呀&auto=1',
    expected: '你好呀',
    getOutput: (page) => page.locator('.tool-section .tool-panel').nth(1).locator('textarea').inputValue(),
    assert: (output, expected) => output.includes(expected) && output.length > expected.length
  },
  {
    name: 'css-minifier',
    path: '/tools/css-minifier?css=body%20%7B%20margin%3A%200%3B%20%7D&auto=1',
    expected: 'body{margin:0}',
    getOutput: (page) => page.locator('.tool-section .tool-panel').nth(1).locator('textarea').inputValue()
  },
  {
    name: 'cron',
    path: '/tools/cron?expr=0%200%20*%20*%20*&auto=1',
    expected: '最近执行时间',
    getOutput: (page) => page.locator('.next-list').textContent()
  },
  {
    name: 'svg-editor',
    path: '/tools/svg-editor?svg=%3Csvg%20width%3D%22200%22%20height%3D%22200%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22blue%22%2F%3E%3C%2Fsvg%3E&auto=1',
    expected: '<svg',
    getOutput: (page) => page.locator('.code-area').inputValue()
  },
  // ===== 餐饮测算类 =====
  {
    // 正向计算器：学校商区（8 个月摊房租），月固定成本 21500，月净利 23500
    name: 'restaurant-profit',
    path: '/tools/restaurant-profit?district=school&rent=48000&salary=4500&staff=3&util=2000&gm=0.6&ticket=25&target=100',
    expected: '23,500',
    getOutput: (page) => page.locator('.metric', { hasText: '目标月净利润' }).locator('.metric-value').textContent().catch(() => '')
  },
  {
    // 营业口径对比卡片：学校商区年净利 = 月净利 × 8 = 188,000
    name: 'restaurant-profit-compare',
    path: '/tools/restaurant-profit?district=school&rent=48000&salary=4500&staff=3&util=2000&gm=0.6&ticket=25&target=100',
    expected: '188,000',
    getOutput: (page) => page.locator('.compare-col.compare-actual').textContent().catch(() => '')
  },
  {
    // 反向调研：日营业额 8000 / 客单价 25 = 日均 320 单
    name: 'restaurant-profit-reverse',
    path: '/tools/rpr?mode=dailyRevenue&v=8000&ticket=25&gm=0.6&mrent=15000&util=2000&labor=8000&seats=24&days=30',
    expected: '320',
    getOutput: (page) => page.locator('.metric-value').first().textContent().catch(() => '')
  },
  {
    // 菜单毛利率：example=1 静默加载示例，整体毛利率 63.57%
    name: 'menu-gross-margin',
    path: '/tools/menu-gross-margin?example=1',
    expected: '63.57%',
    getOutput: (page) => page.locator('.result-big-number').textContent().catch(() => '')
  },
  {
    // 简易毛利率：默认成本 12 / 售价 28 = 57.14%
    name: 'gross-margin',
    path: '/tools/gross-margin',
    expected: '57.14%',
    getOutput: (page) => page.locator('.gm-rate-value').textContent().catch(() => '')
  },
  {
    // 门头编辑器：默认自动创建示例标题元素，画布渲染
    name: 'storefront-sign',
    path: '/tools/storefront-sign-editor',
    expected: '0',
    getOutput: async (page) => String(await page.locator('canvas').count()),
    assert: (output) => Number(output) > 0
  },
  // ===== 驾考类 =====
  {
    // 科目一顺序练习自动开始，题库 2006 题
    name: 'driving-quiz',
    path: '/driving/quiz?subject=km1&mode=sequential&auto=1',
    expected: '/ 2006',
    getOutput: (page) => page.locator('.quiz-header').textContent().catch(() => '')
  },
  {
    // 交通标志图库：异步加载后至少渲染一个标志卡片
    name: 'traffic-signs',
    path: '/driving/traffic-signs',
    expected: '0',
    getOutput: async (page) => String(await page.locator('.sign-card').count()),
    assert: (output) => Number(output) > 0
  }
]

async function run() {
  mkdirSync(SCREENSHOTS, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const results = []

  for (const c of cases) {
    const page = await context.newPage()
    const url = `${BASE}${c.path}`
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(500)

      const output = await waitForOutput(page, c.getOutput)
      const assertFn = c.assert || ((text, expected) => text.includes(expected))
      const ok = assertFn(output, c.expected)

      const screenshotPath = join(SCREENSHOTS, `${c.name}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false })

      results.push({ name: c.name, url, ok, output, expected: c.expected, screenshotPath, error: null })
    } catch (err) {
      const screenshotPath = join(SCREENSHOTS, `${c.name}-error.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {})
      results.push({ name: c.name, url, ok: false, output: '', expected: c.expected, screenshotPath, error: err.message })
    } finally {
      await page.close()
    }
  }

  await browser.close()

  const reportPath = join(SCREENSHOTS, 'results.json')
  writeFileSync(reportPath, JSON.stringify(results, null, 2))

  const failed = results.filter((r) => !r.ok)
  console.log(JSON.stringify(results, null, 2))

  if (failed.length > 0) {
    console.error(`\n❌ ${failed.length}/${results.length} 个用例失败`)
    process.exit(1)
  }

  console.log(`\n✅ ${results.length}/${results.length} 个用例通过，截图保存在 ${SCREENSHOTS}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
