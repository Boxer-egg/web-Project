import routesMeta from './_shared/routes-meta.json'

const SITE = 'https://vvzzv.com'

/** Paths that should 301 instead of being handled as pages. */
const REDIRECTS = {
  '/tools/restaurant-profit-reverse': '/tools/rpr',
}

function escapeHtmlAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

/** True for extension-less page paths (e.g. /tools/regex), false for assets. */
function isPagePath(pathname) {
  const last = pathname.split('/').pop()
  return !last.includes('.')
}

function injectMeta(html, path, meta) {
  const url = `${SITE}${path === '/' ? '' : path}`
  const title = escapeHtmlAttr(meta.title)
  const desc = escapeHtmlAttr(meta.description)

  let out = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${desc}">`
    )
    .replace(
      /<link rel="canonical" href="[^"]*">/,
      `<link rel="canonical" href="${url}">`
    )
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${desc}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${title}">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${desc}">`)

  if (path !== '/') {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '在线工具箱', item: SITE },
        { '@type': 'ListItem', position: 2, name: meta.title, item: url },
      ],
    }
    out = out.replace(
      '</head>',
      `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`
    )
  }
  return out
}

function render404Html(path) {
  const title = '页面未找到 - 在线工具箱'
  const desc = '你访问的页面不存在，返回在线工具箱首页浏览 50+ 款纯前端实用工具。'
  const home = `${SITE}/`
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${SITE}${path === '/' ? '' : path}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${SITE}${path === '/' ? '' : path}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <style>
    :root {
      --bg: #f8fafc;
      --text: #1f2937;
      --muted: #6b7280;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f172a;
        --text: #f8fafc;
        --muted: #94a3b8;
        --accent: #60a5fa;
        --accent-hover: #3b82f6;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 24px;
    }
    .container {
      text-align: center;
      max-width: 480px;
    }
    .icon {
      font-size: 72px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 28px;
      margin: 0 0 12px;
    }
    p {
      color: var(--muted);
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 24px;
    }
    a {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 8px;
      background: var(--accent);
      color: #fff;
      text-decoration: none;
      font-size: 15px;
      font-weight: 500;
      transition: background 0.2s;
    }
    a:hover {
      background: var(--accent-hover);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔍</div>
    <h1>页面未找到</h1>
    <p>你访问的地址已不存在或从未被创建。当前站点为在线工具箱，返回首页可浏览 50+ 款纯前端实用工具。</p>
    <a href="${home}">🏠 返回首页</a>
  </div>
</body>
</html>`
}

export async function onRequest(context) {
  const { request, next } = context
  const url = new URL(request.url)
  let pathname = url.pathname

  if (request.method !== 'GET' || pathname.startsWith('/api/') || !isPagePath(pathname)) {
    return next()
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1)
  }

  if (REDIRECTS[pathname]) {
    return Response.redirect(`${SITE}${REDIRECTS[pathname]}`, 301)
  }

  const known = !!routesMeta[pathname]
  if (!known) {
    const html = render404Html(pathname)
    return new Response(html, {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  const res = await next()
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) {
    return res
  }

  const meta = routesMeta[pathname]
  const html = await res.text()
  const body = injectMeta(html, pathname, meta)
  const headers = new Headers(res.headers)
  headers.set('content-type', 'text/html; charset=utf-8')

  return new Response(body, {
    status: 200,
    headers,
  })
}
