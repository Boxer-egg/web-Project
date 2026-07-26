/**
 * Fetch with timeout support.
 *
 * @param {string|Request} url
 * @param {RequestInit} [options={}]
 * @param {number} [timeoutMs=10000]
 * @returns {Promise<Response>}
 * @throws {Error} When the request times out or fetch fails.
 */
export function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId))
    .catch((err) => {
      if (err.name === 'AbortError') {
        throw new Error(`请求超时（${timeoutMs}ms）`)
      }
      throw err
    })
}
