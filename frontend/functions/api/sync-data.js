import { handleOptions, parseParams, jsonOk, jsonError } from '../_shared/handler.js'

const CODE_PREFIX = 'drv-'
const MAX_DATA_SIZE = 50 * 1024

function validateCode(code) {
  return typeof code === 'string' && code.startsWith(CODE_PREFIX) && code.length < 100
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const params = await parseParams(context.request)
  const code = params.code || ''

  if (!validateCode(code)) {
    return jsonError('无效的恢复码')
  }

  const kv = context.env.USER_DATA
  if (!kv) {
    return jsonError('KV binding not configured', 500)
  }

  if (context.request.method === 'GET') {
    const data = await kv.get(code, 'text')
    if (!data) {
      return jsonOk({ exists: false, data: null })
    }
    try {
      return jsonOk({ exists: true, data: JSON.parse(data) })
    } catch {
      return jsonError('数据损坏', 500)
    }
  }

  if (context.request.method === 'PUT') {
    const payload = params.data
    if (!payload) {
      return jsonError('缺少 data 参数')
    }
    const raw = JSON.stringify(payload)
    if (raw.length > MAX_DATA_SIZE) {
      return jsonError('数据过大（上限 50KB）')
    }
    await kv.put(code, raw)
    return jsonOk({ saved: true })
  }

  if (context.request.method === 'DELETE') {
    await kv.delete(code)
    return jsonOk({ deleted: true })
  }

  return jsonError('Method not allowed', 405)
}
