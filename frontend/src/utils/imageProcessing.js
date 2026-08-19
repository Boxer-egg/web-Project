/**
 * Image processing utilities for the storefront sign editor.
 *
 * All processing runs on ImageBitmap / Canvas in the main thread.
 * For heavy work this can be moved to a Web Worker later.
 */

/**
 * Load an image from a File or URL.
 * @param {File|string} source
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))

    if (source instanceof File) {
      const url = URL.createObjectURL(source)
      img.src = url
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
    } else {
      img.src = source
    }
  })
}

/**
 * Convert a loaded image to a data URL of the given MIME type.
 */
export function imageToDataURL(img, mimeType = 'image/png') {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL(mimeType)
}

/**
 * Remove near-white background from a raster image.
 * @param {HTMLImageElement} img
 * @param {number} threshold - 0~255 distance from pure white.
 * @returns {string} data URL of processed PNG
 */
export function removeBackground(img, threshold = 30) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const thr2 = threshold * threshold * 3

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const dist2 = r * r + g * g + b * b
    if (dist2 >= 3 * 255 * 255 - thr2) {
      data[i + 3] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Replace the dominant color of a raster image with a target color.
 * @param {HTMLImageElement} img
 * @param {string} replacementColor - CSS color string
 * @param {number} tolerance - 0~255 color distance tolerance
 * @returns {string} data URL of processed PNG
 */
export function replaceDominantColor(img, replacementColor = '#000000', tolerance = 60) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Find dominant non-transparent color by sampling center pixels.
  const sampleW = Math.max(1, Math.floor(canvas.width / 4))
  const sampleH = Math.max(1, Math.floor(canvas.height / 4))
  const startX = Math.floor((canvas.width - sampleW) / 2)
  const startY = Math.floor((canvas.height - sampleH) / 2)
  const counts = new Map()
  let dominant = null
  let maxCount = 0

  for (let y = startY; y < startY + sampleH; y++) {
    for (let x = startX; x < startX + sampleW; x++) {
      const i = (y * canvas.width + x) * 4
      if (data[i + 3] < 128) continue
      const key = `${data[i]},${data[i + 1]},${data[i + 2]}`
      const count = (counts.get(key) || 0) + 1
      counts.set(key, count)
      if (count > maxCount) {
        maxCount = count
        dominant = [data[i], data[i + 1], data[i + 2]]
      }
    }
  }

  if (!dominant) return canvas.toDataURL('image/png')

  const [dr, dg, db] = dominant
  const [tr, tg, tb] = parseColor(replacementColor)

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const dist = Math.sqrt(
      Math.pow(data[i] - dr, 2) + Math.pow(data[i + 1] - dg, 2) + Math.pow(data[i + 2] - db, 2)
    )
    if (dist <= tolerance) {
      data[i] = tr
      data[i + 1] = tg
      data[i + 2] = tb
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Parse a CSS color string to [r, g, b].
 * Supports #rgb, #rrggbb, and rgb() formats.
 */
export function parseColor(color) {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

/**
 * Process a logo image according to the element settings.
 */
export async function processLogo(source, { removeBackground: shouldRemoveBg = false, removeThreshold = 30, replaceColor: shouldReplaceColor = false, replacementColor = '#000000' } = {}) {
  const img = await loadImage(source)
  let dataUrl = imageToDataURL(img, 'image/png')

  if (shouldRemoveBg) {
    dataUrl = removeBackground(img, removeThreshold)
  }

  if (shouldReplaceColor) {
    const tempImg = await loadImage(dataUrl)
    dataUrl = replaceDominantColor(tempImg, replacementColor)
  }

  return dataUrl
}
