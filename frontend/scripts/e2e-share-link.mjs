#!/usr/bin/env node
/**
 * E2E tests for the URL share feature of the restaurant calculators.
 *
 * Verifies:
 *   1. Opening a URL with query params back-fills the form (RPR + RPC).
 *   2. Editing an input syncs params into the address bar (replaceState).
 *   3. "复制分享链接" copies a URL that contains the current values.
 *   4. The copied URL opened in a fresh page reproduces the same results.
 *
 * Usage:
 *   BASE_URL=http://localhost:4173 node scripts/e2e-share-link.mjs
 *   BASE_URL=https://xxx.dev-web-tools.pages.dev node scripts/e2e-share-link.mjs
 */

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const BASE = process.env.BASE_URL
if (!BASE) {
  console.error('Error: BASE_URL is required.')
  console.error('Example: BASE_URL=http://localhost:4173 node scripts/e2e-share-link.mjs')
  process.exit(1)
}

const SCREENSHOTS = process.env.SCREENSHOT_DIR || '/tmp/share-link-e2e-screenshots'
mkdirSync(SCREENSHOTS, { recursive: true })

/**
 * Poll until fn returns a truthy value or the timeout expires.
 * @param {() => Promise<any>} fn
 * @param {{ timeout?: number, interval?: number }} options
 */
async function waitUntil(fn, { timeout = 8000, interval = 200 } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const val = await fn()
    if (val) return val
    await new Promise(r => setTimeout(r, interval))
  }
  throw new Error('waitUntil timed out')
}

const browser = await chromium.launch({ headless: true })
const results = []

/**
 * Run one named test case with its own browser context.
 * @param {string} name
 * @param {(context: import('playwright').BrowserContext) => Promise<void>} fn
 */
async function runCase(name, fn) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  const page = await context.newPage()
  try {
    await fn({ context, page })
    await page.screenshot({ path: join(SCREENSHOTS, `${name}.png`) })
    results.push({ name, ok: true, error: null })
    console.log(`✅ ${name}`)
  } catch (err) {
    await page.screenshot({ path: join(SCREENSHOTS, `${name}-error.png`) }).catch(() => {})
    results.push({ name, ok: false, error: err.message })
    console.error(`❌ ${name}: ${err.message}`)
  } finally {
    await context.close()
  }
}

// ---------- 反向调研（/tools/rpr） ----------

await runCase('rpr-backfill', async ({ page }) => {
  await page.goto(
    `${BASE}/tools/rpr?mode=dailyRevenue&v=2000&ticket=20&gm=0.6&mrent=15000&util=2000&labor=8000&days=30&name=测试店`,
    { waitUntil: 'domcontentloaded' }
  )
  await waitUntil(async () => page.locator('.metric-grid').isVisible().catch(() => false))

  const checks = [
    ['调研数值', '.form-row input.input', '2000'],
  ]
  // 校验各输入框回填
  const inputs = page.locator('#reverse-input input.input')
  const values = await inputs.evaluateAll(els => els.map(el => el.value))
  const text = values.join('|')
  for (const expected of ['2000', '20', '0.6', '15000', '2000', '8000', '30', '测试店']) {
    if (!text.includes(expected)) throw new Error(`回填缺少值：${expected}（当前：${text}）`)
  }

  // 结果指标应基于 URL 参数算出（非 —）
  const dailyOrders = await page.locator('.metric.highlight .metric-value').textContent()
  if (!dailyOrders || dailyOrders.trim() === '—') throw new Error('日均单数未计算')
})

await runCase('rpr-url-sync', async ({ page }) => {
  await page.goto(`${BASE}/tools/rpr`, { waitUntil: 'domcontentloaded' })
  await waitUntil(async () => page.locator('#reverse-input').isVisible().catch(() => false))

  // 在平均客单价输入框输入 25，等待防抖后地址栏应包含 ticket=25
  const ticketInput = page.locator('#reverse-input .form-col').filter({ hasText: '平均客单价' }).locator('input')
  await ticketInput.fill('25')
  await waitUntil(async () => page.url().includes('ticket=25'))
})

await runCase('rpr-copy-link-roundtrip', async ({ page, context }) => {
  await page.goto(`${BASE}/tools/rpr`, { waitUntil: 'domcontentloaded' })
  await waitUntil(async () => page.locator('#reverse-input').isVisible().catch(() => false))

  // 填写关键字段
  await page.locator('#reverse-input input.input').first().fill('3000') // 日营业额
  const ticketInput = page.locator('#reverse-input .form-col').filter({ hasText: '平均客单价' }).locator('input')
  await ticketInput.fill('25')

  // 点击复制分享链接并读取剪贴板
  await page.locator('button:has-text("复制分享链接")').click()
  const clip = await waitUntil(async () => {
    const t = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '')
    return t && t.includes('/tools/rpr') ? t : null
  })
  if (!clip.includes('v=3000') || !clip.includes('ticket=25')) {
    throw new Error(`分享链接缺少参数：${clip}`)
  }

  // 用新页面打开分享链接，验证数值还原
  const page2 = await context.newPage()
  await page2.goto(clip, { waitUntil: 'domcontentloaded' })
  await waitUntil(async () => page2.locator('.metric-grid').isVisible().catch(() => false))
  const inputs = await page2.locator('#reverse-input input.input').evaluateAll(els => els.map(el => el.value))
  if (!inputs.join('|').includes('3000') || !inputs.join('|').includes('25')) {
    throw new Error(`分享链接还原失败：${inputs.join('|')}`)
  }
  await page2.close()
})

// ---------- 盈利计算器（/tools/restaurant-profit） ----------

await runCase('rpc-backfill', async ({ page }) => {
  await page.goto(
    `${BASE}/tools/restaurant-profit?district=school&area=140&rent=50000&deposit=75000&transfer=30000&decor=15000&equip=3000&material=5000&salary=2700&staff=2&util=1500&gm=0.5&ticket=17&seats=24&tables=9&months=8&target=80&name=示例店`,
    { waitUntil: 'domcontentloaded' }
  )
  await waitUntil(async () => page.locator('.restaurant-profit, .tool-page').isVisible().catch(() => false))

  const inputs = await page.locator('input').evaluateAll(els => els.map(el => el.value))
  const text = inputs.join('|')
  for (const expected of ['140', '50000', '75000', '30000', '2700', '0.5', '17', '24', '80', '示例店']) {
    if (!text.includes(expected)) throw new Error(`回填缺少值：${expected}`)
  }
})

await runCase('rpc-copy-link-roundtrip', async ({ page, context }) => {
  await page.goto(`${BASE}/tools/restaurant-profit`, { waitUntil: 'domcontentloaded' })
  await waitUntil(async () => page.locator('button:has-text("复制分享链接")').isVisible().catch(() => false))

  // 加载示例后复制链接
  await page.locator('button:has-text("加载表格示例")').click()
  await page.locator('button:has-text("复制分享链接")').click()
  const clip = await waitUntil(async () => {
    const t = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '')
    return t && t.includes('/tools/restaurant-profit') ? t : null
  })
  for (const expected of ['district=school', 'area=140', 'rent=50000', 'ticket=17', 'target=80']) {
    if (!clip.includes(expected)) throw new Error(`分享链接缺少 ${expected}：${clip}`)
  }

  // 新上下文（清空 localStorage）打开链接，验证还原
  const fresh = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page2 = await fresh.newPage()
  await page2.goto(clip, { waitUntil: 'domcontentloaded' })
  await waitUntil(async () => page2.locator('.tool-page').isVisible().catch(() => false))
  const inputs = await page2.locator('input').evaluateAll(els => els.map(el => el.value))
  const text = inputs.join('|')
  for (const expected of ['140', '50000', '2700', '17', '80']) {
    if (!text.includes(expected)) throw new Error(`还原缺少值：${expected}`)
  }
  await fresh.close()
})

await browser.close()

writeFileSync(join(SCREENSHOTS, 'results.json'), JSON.stringify(results, null, 2))

const failed = results.filter(r => !r.ok)
if (failed.length > 0) {
  console.error(`\n❌ ${failed.length}/${results.length} 个用例失败`)
  process.exit(1)
}
console.log(`\n✅ ${results.length}/${results.length} 个用例通过，截图保存在 ${SCREENSHOTS}`)
