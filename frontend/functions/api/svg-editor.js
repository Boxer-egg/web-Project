import { handleOptions, parseParams, jsonOk, jsonError } from '../_shared/handler.js'
import { formatSvg, minifySvg } from '../../src/logic/svg.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const params = await parseParams(context.request)
  const svg = params.svg || ''
  if (!svg) return jsonError('缺少 svg 参数')

  const action = params.action || 'preview'

  try {
    if (action === 'format') {
      return jsonOk({ action, svg, result: formatSvg(svg) })
    }
    if (action === 'minify') {
      return jsonOk({ action, svg, result: minifySvg(svg) })
    }
    return jsonOk({ action: 'preview', svg })
  } catch (e) {
    return jsonError('SVG 处理失败: ' + e.message, 422)
  }
}
