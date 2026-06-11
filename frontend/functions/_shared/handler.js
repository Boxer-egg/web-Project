/**
 * Shared API handler utilities for Cloudflare Pages Functions.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function jsonOk(data) {
  return new Response(JSON.stringify({ ok: true, ...data }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  })
}

export function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  })
}

/** Normalize a param to an array of numbers (handles POST JSON array or GET comma-string) */
export function toNumberArray(val, defaults) {
  if (Array.isArray(val)) {
    const arr = val.map(Number).filter(n => !isNaN(n))
    return arr.length ? arr : defaults
  }
  if (typeof val === 'string') {
    const arr = val.split(',').map(Number).filter(n => !isNaN(n))
    return arr.length ? arr : defaults
  }
  return defaults
}

/** Handle CORS preflight */
export function handleOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

/** Parse request params from JSON body (POST) or query string (GET) */
export async function parseParams(request) {
  if (request.method === 'GET') {
    const url = new URL(request.url)
    const params = {}
    for (const [key, value] of url.searchParams) {
      params[key] = value
    }
    return params
  }
  if (request.headers.get('content-type')?.includes('application/json')) {
    return await request.json()
  }
  return {}
}
