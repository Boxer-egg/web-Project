import { handleOptions, parseParams, jsonOk, jsonError } from '../_shared/handler.js'
import { utf8ToBase64, base64ToUtf8, detectBase64 } from '../_shared/tools.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const params = await parseParams(context.request)
  const text = params.text || ''
  if (!text) return jsonError('缺少 text 参数')

  const action = params.action || 'auto'
  const isBase64 = detectBase64(text)

  try {
    if (action === 'encode' || (action === 'auto' && !isBase64)) {
      return jsonOk({ input: text, output: utf8ToBase64(text), action: 'encode' })
    } else {
      const decoded = base64ToUtf8(text)
      return jsonOk({ input: text, output: decoded, action: 'decode' })
    }
  } catch (e) {
    return jsonError('处理失败: ' + e.message, 422)
  }
}
