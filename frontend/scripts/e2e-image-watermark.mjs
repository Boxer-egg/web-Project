#!/usr/bin/env node
/**
 * End-to-end tests for the Image Watermark Generator.
 *
 * Starts a local Vite dev server, opens the tool page in a headless browser,
 * uploads a generated test image, interacts with the controls, and verifies
 * that the canvas renders and the download button works without error.
 *
 * Usage:
 *   cd frontend && node scripts/e2e-image-watermark.mjs
 *
 * Exit code:
 *   0 - all assertions passed
 *   1 - one or more assertions failed
 */

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { deflateSync } from 'node:zlib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const TEST_PORT = 5174
const TEST_URL = `http://localhost:${TEST_PORT}/tools/image-watermark`
const SERVER_START_TIMEOUT_MS = 30000
const ELEMENT_TIMEOUT_MS = 10000

/**
 * PNG CRC-32 lookup table.
 * @returns {Uint32Array} Precomputed CRC table.
 */
function makeCrcTable() {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  return table
}

const CRC_TABLE = makeCrcTable()

/**
 * Compute the CRC-32 of a buffer.
 * @param {Buffer} buffer
 * @returns {number} Unsigned 32-bit CRC.
 */
function crc32(buffer) {
  let c = 0xffffffff
  for (let i = 0; i < buffer.length; i++) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

/**
 * Build a PNG chunk (length + type + data + CRC).
 * @param {string} type Four-character chunk type.
 * @param {Buffer} data Chunk payload.
 * @returns {Buffer} Complete chunk bytes.
 */
function pngChunk(type, data) {
  const typeBuf = Buffer.from(type)
  const lenBuf = Buffer.allocUnsafe(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.allocUnsafe(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

/**
 * Parse a 6-digit hex color into RGB components.
 * @param {string} hex Color like `#4f46e5`.
 * @returns {{ r: number, g: number, b: number }}
 * @throws {Error} If the hex string is not a valid 3 or 6 digit color.
 */
function parseHexColor(hex) {
  const normalized = String(hex || '').replace('#', '')
  const expanded = normalized.length === 3
    ? normalized.split('').map(c => c + c).join('')
    : normalized
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    throw new Error(`Invalid hex color: ${hex}`)
  }
  const int = Number.parseInt(expanded, 16)
  return {
    r: (int >> 16) & 0xff,
    g: (int >> 8) & 0xff,
    b: int & 0xff,
  }
}

/**
 * Generate a minimal valid RGB PNG image in memory.
 * @param {number} width Image width in pixels.
 * @param {number} height Image height in pixels.
 * @param {string} hex Fill color.
 * @returns {Buffer} PNG-encoded bytes.
 */
function generatePng(width, height, hex = '#4f46e5') {
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new Error('PNG dimensions must be positive integers')
  }

  const { r, g, b } = parseHexColor(hex)
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: RGB
  ihdr[10] = 0 // compression method
  ihdr[11] = 0 // filter method
  ihdr[12] = 0 // interlace method

  const pixel = Buffer.from([r, g, b])
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3).fill(pixel)])
  const raw = Buffer.concat(Array.from({ length: height }, () => row))
  const idat = deflateSync(raw, { level: 9 })

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * Create a temporary test PNG file and return its absolute path.
 * The file is written into a fresh temp directory.
 * @returns {string} Absolute path to the generated PNG file.
 */
function ensureTestImage() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watermark-e2e-'))
  const imagePath = path.join(tmpDir, 'test-image.png')
  try {
    const png = generatePng(64, 64, '#4f46e5')
    fs.writeFileSync(imagePath, png)
    return imagePath
  } catch (err) {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors.
    }
    throw err
  }
}

/**
 * Start the Vite dev server and resolve when it reports a local URL.
 * @returns {Promise<import('node:child_process').ChildProcess>}
 */
function startDevServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['vite', '--port', String(TEST_PORT)], {
      cwd: root,
      stdio: 'pipe',
      env: {
        ...process.env,
        HTTP_PROXY: 'http://127.0.0.1:7897',
        HTTPS_PROXY: 'http://127.0.0.1:7897',
      },
    })

    let ready = false

    proc.stdout.on('data', (data) => {
      const text = data.toString()
      if (!ready && text.includes('Local:')) {
        ready = true
        resolve(proc)
      }
    })

    proc.stderr.on('data', (data) => {
      process.stderr.write(data)
    })

    proc.on('error', (err) => {
      if (!ready) reject(err)
    })

    proc.on('exit', (code) => {
      if (!ready) {
        reject(new Error(`Vite dev server exited early with code ${code}`))
      }
    })

    setTimeout(() => {
      if (!ready) {
        reject(new Error(`Vite dev server did not start within ${SERVER_START_TIMEOUT_MS}ms`))
      }
    }, SERVER_START_TIMEOUT_MS)
  })
}

/**
 * Set the value of a range input and dispatch the events Vue v-model expects.
 * @param {import('playwright').Locator} locator
 * @param {number} value
 */
async function setRangeValue(locator, value) {
  await locator.evaluate((el, val) => {
    el.value = String(val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
}

/**
 * Run all assertions against the watermark tool page.
 * @param {import('playwright').Browser} browser
 */
async function runTests(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  })
  const page = await context.newPage()

  let testImagePath = ''

  try {
    await page.goto(TEST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // 1. Verify page title and upload zone.
    await page.waitForSelector('.upload-zone', {
      state: 'visible',
      timeout: ELEMENT_TIMEOUT_MS,
    })
    const title = await page.textContent('h1')
    if (!title.includes('图片水印生成器')) {
      throw new Error(`Page title mismatch: expected "图片水印生成器", got "${title}"`)
    }

    // 2. Upload a generated test image.
    testImagePath = ensureTestImage()
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)

    // 3. Wait for the canvas preview to appear.
    await page.waitForSelector('canvas.watermark-canvas', {
      state: 'visible',
      timeout: ELEMENT_TIMEOUT_MS,
    })

    // 4. Type middle text and verify the input reflects it.
    const textInput = page.locator('.watermark-text-input input[type="text"]')
    await textInput.fill('消防部门审核审查')
    const inputValue = await textInput.inputValue()
    if (inputValue !== '消防部门审核审查') {
      throw new Error(`Middle text input mismatch: got "${inputValue}"`)
    }

    // 5. Change the density slider to enable tiled mode.
    const densitySlider = page.locator('.density-slider-wrap .density-slider')
    await setRangeValue(densitySlider, 0.5)

    // 6. Check single-mode toggle and verify position controls are visible.
    await page.locator('.single-mode-toggle input[type="checkbox"]').check()
    const positionSection = page.locator('.watermark-controls', {
      hasText: '单水印设置',
    })
    await positionSection.waitFor({ state: 'visible', timeout: ELEMENT_TIMEOUT_MS })

    // 7. Sample canvas pixels to confirm the watermark is rendered.
    const centerSamples = await page.locator('canvas.watermark-canvas').evaluate((canvas) => {
      const ctx = canvas.getContext('2d')
      const { width, height } = canvas
      const cx = Math.floor(width / 2)
      const cy = Math.floor(height / 2)
      const points = [
        [cx, cy],
        [cx - 5, cy],
        [cx + 5, cy],
        [cx, cy - 5],
        [cx, cy + 5],
      ]
      return points.map(([x, y]) => {
        const data = ctx.getImageData(x, y, 1, 1).data
        return { r: data[0], g: data[1], b: data[2] }
      })
    })

    const ORIGINAL_FILL = { r: 79, g: 70, b: 229 }
    const hasWatermarkPixel = centerSamples.some(
      (c) =>
        Math.abs(c.r - ORIGINAL_FILL.r) > 10 ||
        Math.abs(c.g - ORIGINAL_FILL.g) > 10 ||
        Math.abs(c.b - ORIGINAL_FILL.b) > 10
    )
    if (!hasWatermarkPixel) {
      throw new Error('Canvas center pixels unchanged; watermark text may not be rendered')
    }

    // 8. Click the download button and verify the filename contains _watermark.
    const downloadButton = page.locator('button.download-btn')
    await downloadButton.waitFor({ state: 'visible', timeout: ELEMENT_TIMEOUT_MS })
    await page.waitForSelector('button.download-btn:not([disabled])', {
      timeout: ELEMENT_TIMEOUT_MS,
    })

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click(),
    ])

    const filename = download.suggestedFilename()
    if (!filename.includes('_watermark')) {
      throw new Error(`Download filename missing _watermark: ${filename}`)
    }
    await download.cancel().catch(() => {})

    return true
  } finally {
    if (testImagePath) {
      const tmpDir = path.dirname(testImagePath)
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
    await context.close()
  }
}

/**
 * Main entry point: start the server, run tests, clean up, and exit.
 */
async function main() {
  let server = null
  let browser = null

  try {
    server = await startDevServer()
    browser = await chromium.launch({ headless: true })
    await runTests(browser)
    console.log('PASS: image-watermark e2e tests passed')
    process.exitCode = 0
  } catch (err) {
    console.error('FAIL: image-watermark e2e tests failed:', err.message)
    process.exitCode = 1
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
    if (server) {
      server.kill('SIGTERM')
      // Give the server a moment to shut down gracefully.
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (!server.killed) {
        server.kill('SIGKILL')
      }
    }
  }
}

main()
