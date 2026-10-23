import { handleOptions, parseParams, jsonOk, jsonError, toNumberArray } from '../_shared/handler.js'
import { convertNumber } from '../../src/logic/numberBase.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const params = await parseParams(context.request)
  const num = params.num || ''
  if (!num) return jsonError('缺少 num 参数')

  const fromBase = parseInt(params.from, 10) || 10
  const toBases = toNumberArray(params.to, [2, 8, 16])

  const result = convertNumber(num, fromBase, toBases)
  return result.error ? jsonError(result.error, 422) : jsonOk(result)
}
