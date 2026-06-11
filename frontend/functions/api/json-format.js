import { handleOptions, parseParams, jsonOk, jsonError } from '../_shared/handler.js'
import { jsonFormat } from '../_shared/tools.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const params = await parseParams(context.request)
  const input = params.input || ''
  if (!input) return jsonError('缺少 input 参数')

  const indent = parseInt(params.indent) || 2
  try {
    const formatted = jsonFormat(input, indent)
    const obj = JSON.parse(formatted)
    return jsonOk({ input, formatted, parsed: obj })
  } catch (e) {
    return jsonError('JSON 解析失败: ' + e.message, 422)
  }
}
