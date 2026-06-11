import { handleOptions, parseParams, jsonOk, jsonError } from '../_shared/handler.js'
import { computeHash } from '../_shared/tools.js'

const VALID_ALGOS = ['md5', 'sha1', 'sha256', 'sha512']

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const params = await parseParams(context.request)
  const text = params.text || ''
  if (!text) return jsonError('缺少 text 参数')

  let algos = Array.isArray(params.algorithms)
    ? params.algorithms.filter(a => VALID_ALGOS.includes(a))
    : params.algorithms?.split(',').map(a => a.trim()).filter(a => VALID_ALGOS.includes(a)) || ['sha256']
  if (!algos.length) algos = ['sha256']

  try {
    const results = {}
    for (const algo of algos) {
      results[algo] = await computeHash(algo, text)
    }
    return jsonOk({ input: text, algorithms: algos, results })
  } catch (e) {
    return jsonError('计算失败: ' + e.message, 500)
  }
}
