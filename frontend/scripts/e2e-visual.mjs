#!/usr/bin/env node
/**
 * E2E visual regression test for all tools.
 *
 * Automatically discovers all tool routes from router/index.js, opens each
 * tool page, waits for rendering, and captures a screenshot. A visual HTML
 * gallery is generated for AI-assisted review.
 *
 * Usage:
 *   BASE_URL=https://xxx.dev-web-tools.pages.dev node scripts/e2e-visual.mjs
 *   BASE_URL=http://localhost:5173 node scripts/e2e-visual.mjs
 *   SCREENSHOT_DIR=/tmp/visual-shots BASE_URL=... node scripts/e2e-visual.mjs
 *   HEADLESS=false BASE_URL=... node scripts/e2e-visual.mjs  # visible browser
 *
 * Exit code:
 *   0 - all screenshots captured successfully
 *   1 - one or more pages failed to load or screenshot
 */

import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BASE = process.env.BASE_URL
if (!BASE) {
  console.error('Error: BASE_URL is required.')
  console.error('')
  console.error('Examples:')
  console.error('  BASE_URL=https://xxx.dev-web-tools.pages.dev node scripts/e2e-visual.mjs')
  console.error('  BASE_URL=http://localhost:5173 node scripts/e2e-visual.mjs')
  process.exit(1)
}

const SCREENSHOTS = process.env.SCREENSHOT_DIR || '/tmp/tool-e2e-visual'
const HEADLESS = process.env.HEADLESS !== 'false'

/**
 * Extract all tool routes from router/index.js
 */
function extractToolRoutes() {
  const routerPath = join(__dirname, '../src/router/index.js')
  const content = readFileSync(routerPath, 'utf-8')

  const routes = []
  const routeRegex = /{\s*path:\s*['"]([^'"]+)['"]\s*,\s*name:\s*['"]([^'"]+)['"]\s*,[\s\S]*?meta:\s*{[\s\S]*?title:\s*['"]([^'"]+)['"]/g

  let match
  while ((match = routeRegex.exec(content)) !== null) {
    const [, path, name, title] = match
    if (path !== '/' && !path.includes('pathMatch')) {
      routes.push({ path, name, title })
    }
  }

  return routes
}

/**
 * Wait for page to be stable (no network activity, main content rendered)
 */
async function waitForStable(page, timeout = 5000) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout })
    await page.waitForTimeout(1000)

    const hasContent = await page.locator('body').evaluate(el => {
      return el.textContent.trim().length > 100 || el.querySelector('canvas, svg, img')
    })

    if (!hasContent) {
      await page.waitForTimeout(2000)
    }
  } catch (err) {
    console.warn(`  ⚠️  Stability wait timeout: ${err.message}`)
  }
}

/**
 * Generate HTML gallery for visual review
 */
function generateHtmlGallery(results, outputPath) {
  const successResults = results.filter(r => r.success)
  const failedResults = results.filter(r => !r.success)

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E2E Visual Test Gallery - ${new Date().toISOString()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { font-size: 24px; margin-bottom: 10px; }
    .summary {
      display: flex;
      gap: 20px;
      margin-top: 10px;
      font-size: 14px;
    }
    .stat { padding: 8px 16px; border-radius: 4px; }
    .stat.success { background: #e8f5e9; color: #2e7d32; }
    .stat.failed { background: #ffebee; color: #c62828; }
    .meta { color: #666; font-size: 14px; margin-top: 10px; }

    .section { margin-bottom: 30px; }
    .section h2 {
      font-size: 18px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #ddd;
    }

    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }

    .card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .card:hover { transform: translateY(-4px); }

    .card-header {
      padding: 15px;
      border-bottom: 1px solid #eee;
    }
    .card-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
    }
    .card-path {
      font-size: 12px;
      color: #666;
      font-family: monospace;
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 3px;
      display: inline-block;
      margin-bottom: 4px;
    }
    .card-url {
      font-size: 11px;
      color: #999;
      word-break: break-all;
    }

    .card-image {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 10;
      overflow: hidden;
      background: #fafafa;
    }
    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
    }
    .card-image img:hover {
      opacity: 0.9;
    }

    .card-error {
      padding: 15px;
      background: #fff3cd;
      border-left: 4px solid #ffc107;
    }
    .error-title {
      font-weight: 600;
      color: #856404;
      margin-bottom: 8px;
    }
    .error-message {
      font-size: 13px;
      color: #856404;
      font-family: monospace;
      white-space: pre-wrap;
    }

    .lightbox {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      z-index: 1000;
      justify-content: center;
      align-items: center;
      padding: 40px;
    }
    .lightbox.active { display: flex; }
    .lightbox img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      box-shadow: 0 0 40px rgba(0,0,0,0.5);
    }
    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 20px;
      color: white;
      font-size: 36px;
      cursor: pointer;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
    }
    .lightbox-close:hover {
      background: rgba(255,255,255,0.2);
    }
  </style>
</head>
<body>
  <header>
    <h1>E2E Visual Test Gallery</h1>
    <div class="summary">
      <div class="stat success">✓ ${successResults.length} 成功</div>
      <div class="stat failed">✗ ${failedResults.length} 失败</div>
    </div>
    <div class="meta">
      <div>Base URL: <code>${BASE}</code></div>
      <div>生成时间: ${new Date().toLocaleString('zh-CN')}</div>
      <div>截图目录: ${SCREENSHOTS}</div>
    </div>
  </header>

  ${successResults.length > 0 ? `
  <div class="section">
    <h2>✓ 成功截图 (${successResults.length})</h2>
    <div class="gallery">
      ${successResults.map(r => `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${r.title}</div>
            <div class="card-path">${r.path}</div>
            <div class="card-url">${r.url}</div>
          </div>
          <div class="card-image">
            <img src="${r.screenshotPath}" alt="${r.title}" onclick="openLightbox('${r.screenshotPath}')">
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${failedResults.length > 0 ? `
  <div class="section">
    <h2>✗ 失败截图 (${failedResults.length})</h2>
    <div class="gallery">
      ${failedResults.map(r => `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${r.title}</div>
            <div class="card-path">${r.path}</div>
            <div class="card-url">${r.url}</div>
          </div>
          <div class="card-error">
            <div class="error-title">错误信息</div>
            <div class="error-message">${r.error || '未知错误'}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div class="lightbox" id="lightbox" onclick="closeLightbox()">
    <div class="lightbox-close">×</div>
    <img id="lightbox-img" src="">
  </div>

  <script>
    function openLightbox(src) {
      document.getElementById('lightbox-img').src = src
      document.getElementById('lightbox').classList.add('active')
      event.stopPropagation()
    }

    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('active')
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox()
    })
  </script>
</body>
</html>`

  writeFileSync(outputPath, html, 'utf-8')
}

async function run() {
  console.log('📋 正在从 router/index.js 提取工具路由...')
  const routes = extractToolRoutes()
  console.log(`   找到 ${routes.length} 个工具\n`)

  mkdirSync(SCREENSHOTS, { recursive: true })

  console.log('🚀 启动浏览器...')
  const browser = await chromium.launch({ headless: HEADLESS })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1
  })

  const results = []
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i]
    const page = await context.newPage()
    const url = `${BASE}${route.path}`
    const progress = `[${i + 1}/${routes.length}]`

    try {
      console.log(`${progress} ${route.name}`)
      console.log(`   ${url}`)

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await waitForStable(page)

      const screenshotFileName = `${route.name}.png`
      const screenshotPath = join(SCREENSHOTS, screenshotFileName)
      await page.screenshot({ path: screenshotPath, fullPage: false })

      results.push({
        name: route.name,
        path: route.path,
        title: route.title,
        url,
        screenshotPath: screenshotFileName,
        success: true,
        error: null
      })

      successCount++
      console.log(`   ✓ 截图已保存\n`)
    } catch (err) {
      console.error(`   ✗ 失败: ${err.message}\n`)

      const screenshotFileName = `${route.name}-error.png`
      const screenshotPath = join(SCREENSHOTS, screenshotFileName)
      await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {})

      results.push({
        name: route.name,
        path: route.path,
        title: route.title,
        url,
        screenshotPath: screenshotFileName,
        success: false,
        error: err.message
      })

      failCount++
    } finally {
      await page.close()
    }
  }

  await browser.close()

  const jsonReportPath = join(SCREENSHOTS, 'results.json')
  writeFileSync(jsonReportPath, JSON.stringify(results, null, 2))
  console.log(`📄 JSON 报告已保存: ${jsonReportPath}`)

  const htmlReportPath = join(SCREENSHOTS, 'gallery.html')
  generateHtmlGallery(results, htmlReportPath)
  console.log(`🎨 HTML 画廊已生成: ${htmlReportPath}`)

  console.log('\n' + '='.repeat(60))
  console.log(`✓ 成功: ${successCount}/${routes.length}`)
  console.log(`✗ 失败: ${failCount}/${routes.length}`)
  console.log('='.repeat(60))

  if (failCount > 0) {
    console.error(`\n❌ ${failCount} 个页面截图失败`)
    process.exit(1)
  }

  console.log(`\n✅ 所有截图完成，查看 HTML 报告:\n   ${htmlReportPath}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
