#!/usr/bin/env node
/**
 * E2E tests for driving license tools.
 *
 * Verifies the driving quiz, study, subject-4 practice and traffic sign gallery.
 * Uses Playwright against a local or deployed build.
 *
 * Usage:
 *   BASE_URL=http://localhost:5173 node scripts/e2e-driving.mjs
 *   BASE_URL=https://xxx.dev-web-tools.pages.dev node scripts/e2e-driving.mjs
 */

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const BASE = process.env.BASE_URL
if (!BASE) {
  console.error('Error: BASE_URL is required.')
  console.error('Examples:')
  console.error('  BASE_URL=http://localhost:5173 node scripts/e2e-driving.mjs')
  console.error('  BASE_URL=https://xxx.dev-web-tools.pages.dev node scripts/e2e-driving.mjs')
  process.exit(1)
}

const SCREENSHOTS = process.env.SCREENSHOT_DIR || '/tmp/driving-e2e-screenshots'

/**
 * Poll until a locator is visible or timeout expires.
 * @param {import('playwright').Locator} locator
 * @param {{ timeout?: number, interval?: number }} options
 */
async function waitForVisible(locator, { timeout = 10000, interval = 200 } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await locator.isVisible().catch(() => false)) return
    await locator.page().waitForTimeout(interval)
  }
  throw new Error(`Timed out waiting for element: ${locator.toString()}`)
}

/**
 * Capture a screenshot and append result info.
 * @param {import('playwright').Page} page
 * @param {string} name
 */
async function screenshot(page, name) {
  const path = join(SCREENSHOTS, `${name}.png`)
  await page.screenshot({ path, fullPage: false })
  return path
}

/**
 * Run a single test case.
 * @param {string} name
 * @param {(page: import('playwright').Page) => Promise<void>} fn
 */
async function runCase(name, fn) {
  const page = await context.newPage()
  try {
    await page.goto(`${BASE}/driving/`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(300)
    await fn(page)
    const path = await screenshot(page, name)
    results.push({ name, ok: true, screenshotPath: path, error: null })
    console.log(`✅ ${name}`)
  } catch (err) {
    const path = await screenshot(page, `${name}-error`).catch(() => null)
    results.push({ name, ok: false, screenshotPath: path, error: err.message })
    console.error(`❌ ${name}: ${err.message}`)
  } finally {
    await page.close()
  }
}

mkdirSync(SCREENSHOTS, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const results = []

await runCase('quiz-home', async (page) => {
  await page.goto(`${BASE}/driving/quiz`, { waitUntil: 'domcontentloaded' })
  await waitForVisible(page.locator('.quiz-home'))
  await waitForVisible(page.locator('.quiz-modes h3:has-text("顺序练习")'))
})

await runCase('quiz-practice-single', async (page) => {
  await page.goto(`${BASE}/driving/quiz`, { waitUntil: 'domcontentloaded' })
  await page.locator('.quiz-modes .mode-card:has(h3:has-text("顺序练习"))').click()
  await waitForVisible(page.locator('.quiz-session'))

  // Answer the first option; for the first question it happens to be correct.
  const firstOption = page.locator('.options-list .option-btn').first()
  await waitForVisible(firstOption)
  await firstOption.click()

  // Explanation should appear after selecting a single-choice answer.
  await waitForVisible(page.locator('.explain-box:has-text("正确答案")'))
})

await runCase('quiz-wrong-book', async (page) => {
  await page.goto(`${BASE}/driving/quiz`, { waitUntil: 'domcontentloaded' })

  // Enter sequential practice and intentionally answer the first question wrong.
  await page.locator('.quiz-modes .mode-card:has(h3:has-text("顺序练习"))').click()
  await waitForVisible(page.locator('.quiz-session'))
  await page.locator('.options-list .option-btn').nth(1).click()
  await waitForVisible(page.locator('.explain-box:has-text("正确答案")'))

  // Return home and start wrong-book review.
  await page.locator('button:has-text("返回首页")').click()
  await waitForVisible(page.locator('.quiz-home'))
  await page.locator('.quiz-modes .mode-card:has(h3:has-text("错题本"))').click()

  // Should enter practice view with the wrong-book badge.
  await waitForVisible(page.locator('.quiz-badge:has-text("错题本")'))
})

await runCase('quiz-multiple-lock', async (page) => {
  await page.goto(`${BASE}/driving/quiz`, { waitUntil: 'domcontentloaded' })
  await page.locator('.quiz-modes .mode-card:has(h3:has-text("顺序练习"))').click()
  await waitForVisible(page.locator('.quiz-session'))

  // Navigate forward until a multiple-choice question is found (max 20).
  let found = false
  for (let i = 0; i < 20; i++) {
    const badge = page.locator('.quiz-badge').first()
    const text = await badge.textContent()
    if (text === '多选题') {
      found = true
      break
    }
    await page.locator('button:has-text("下一题")').click()
    await page.waitForTimeout(200)
  }
  if (!found) {
    console.warn('⚠️ 未找到多选题，跳过锁定验证')
    return
  }

  // Select two options and confirm.
  await page.locator('.options-list .option-btn').nth(0).click()
  await page.locator('.options-list .option-btn').nth(1).click()
  await page.locator('button:has-text("确认答案")').click()
  await waitForVisible(page.locator('.explain-box:has-text("正确答案")'))

  // After confirming, clicking another option should not change the selection.
  const thirdOption = page.locator('.options-list .option-btn').nth(2)
  const initialSelectedCount = await page.locator('.options-list .option-btn.selected').count()
  await thirdOption.click()
  const afterSelectedCount = await page.locator('.options-list .option-btn.selected').count()
  if (afterSelectedCount !== initialSelectedCount) {
    throw new Error('多选题提交后仍可修改选项')
  }
})

await runCase('study-progress', async (page) => {
  await page.goto(`${BASE}/driving/license-study`, { waitUntil: 'domcontentloaded' })
  await waitForVisible(page.locator('.study-overview'))

  // Click the first topic.
  const firstTopic = page.locator('.topic-item').first()
  await waitForVisible(firstTopic)
  const beforeCompleted = await page.locator('.topic-item.completed').count()
  await firstTopic.click()
  await waitForVisible(page.locator('.study-topic'))

  // Click "下一节" to mark complete and move on.
  await page.locator('button:has-text("下一节")').click()
  await page.waitForTimeout(300)

  // Go back to overview and verify the topic is marked completed.
  await page.locator('button:has-text("返回概览")').click()
  await waitForVisible(page.locator('.study-overview'))
  const afterCompleted = await page.locator('.topic-item.completed').count()
  if (afterCompleted <= beforeCompleted) {
    throw new Error('点击下一节后未标记为完成')
  }
})

await runCase('jk-judgment', async (page) => {
  await page.goto(`${BASE}/driving/jk`, { waitUntil: 'domcontentloaded' })
  await waitForVisible(page.locator('.jsyks-kms4:has-text("第 1 /")'))

  // Click the first option and verify a result is shown.
  const firstOption = page.locator('.options li').first()
  await waitForVisible(firstOption)
  await firstOption.click()
  await waitForVisible(page.locator('.answer-result'))
})

await runCase('traffic-sign-modal', async (page) => {
  await page.goto(`${BASE}/driving/traffic-signs`, { waitUntil: 'domcontentloaded' })
  await waitForVisible(page.locator('.sign-grid'))

  // Open the first sign.
  const firstSign = page.locator('.sign-card').first()
  await waitForVisible(firstSign)
  await firstSign.click()

  // Modal should appear with navigation arrows inside the card.
  const modal = page.locator('.modal-card')
  await waitForVisible(modal)
  const nextArrow = modal.locator('.nav-next')
  await waitForVisible(nextArrow)

  // Click next and verify the title changed.
  const title = modal.locator('h2')
  const beforeTitle = await title.textContent()
  await nextArrow.click()
  await page.waitForTimeout(300)
  const afterTitle = await title.textContent()
  if (beforeTitle === afterTitle) {
    throw new Error('点击下一张标志后标题未变化')
  }
})

await browser.close()

const reportPath = join(SCREENSHOTS, 'results.json')
writeFileSync(reportPath, JSON.stringify(results, null, 2))

const failed = results.filter((r) => !r.ok)
if (failed.length > 0) {
  console.error(`\n❌ ${failed.length}/${results.length} 个用例失败`)
  process.exit(1)
}

console.log(`\n✅ ${results.length}/${results.length} 个用例通过，截图保存在 ${SCREENSHOTS}`)
