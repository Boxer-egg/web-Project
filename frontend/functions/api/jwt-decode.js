import { handleOptions, parseParams, jsonOk, jsonError } from '../_shared/handler.js'
import { jwtDecode } from '../_shared/tools.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const params = await parseParams(context.request)
  const token = params.token || ''
  if (!token) return jsonError('缺少 token 参数')

  const result = jwtDecode(token)
  if (result.error && !result.payload) {
    return jsonError(result.error, 422)
  }
  return jsonOk(result)
}
