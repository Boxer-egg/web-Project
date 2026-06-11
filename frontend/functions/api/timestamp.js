import { handleOptions, parseParams, jsonOk, jsonError } from '../_shared/handler.js'
import { tsToDate, dateToTs } from '../_shared/tools.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const params = await parseParams(context.request)

  if (params.ts) {
    const result = tsToDate(params.ts)
    return result.error ? jsonError(result.error, 422) : jsonOk(result)
  }
  if (params.date) {
    const result = dateToTs(params.date)
    return result.error ? jsonError(result.error, 422) : jsonOk(result)
  }
  return jsonError('请提供 ts 或 date 参数')
}
