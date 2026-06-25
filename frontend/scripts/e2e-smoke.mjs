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
 *   expected      - substring expected in the output
 *   getOutput     - Playwright locator expression that extracts the output text
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
