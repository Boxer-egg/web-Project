import { handleOptions, parseParams, jsonOk, jsonError } from '../_shared/handler.js'
import { formatCode } from '../_shared/tools.js'

const VALID_LANGS = ['javascript', 'css', 'html', 'json']

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const params = await parseParams(context.request)
  const code = params.code || ''
  if (!code) return jsonError('缺少 code 参数')

  const lang = VALID_LANGS.includes(params.lang) ? params.lang : 'javascript'
  const indent = parseInt(params.indent) || 2

  try {
    const formatted = await formatCode(code, lang, indent)
    return jsonOk({ input: code, lang, indent, formatted })
  } catch (e) {
    return jsonError('格式化失败: ' + e.message, 422)
  }
}
