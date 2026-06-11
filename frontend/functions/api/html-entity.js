import { handleOptions, parseParams, jsonOk, jsonError } from '../_shared/handler.js'
import { htmlEncodeNamed, htmlEncodeNumeric, htmlEncodeHex, htmlDecode } from '../_shared/tools.js'

const ACTIONS = {
  encode_named: htmlEncodeNamed,
  encode_numeric: htmlEncodeNumeric,
  encode_hex: htmlEncodeHex,
  decode: htmlDecode,
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const params = await parseParams(context.request)
  const text = params.text || ''
  if (!text) return jsonError('缺少 text 参数')

  const action = params.action || 'encode_named'
  const fn = ACTIONS[action]
  if (!fn) return jsonError(`不支持的操作: ${action}，可选: ${Object.keys(ACTIONS).join(', ')}`)

  try {
    const output = fn(text)
    return jsonOk({ input: text, output, action })
  } catch (e) {
    return jsonError('处理失败: ' + e.message, 422)
  }
}
