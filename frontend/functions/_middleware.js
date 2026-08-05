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

  const res = await next()
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) {
    return res
  }

  const meta = routesMeta[pathname] || routesMeta['/']
  const html = await res.text()
  const body = injectMeta(html, pathname, meta)
  const headers = new Headers(res.headers)
  headers.set('content-type', 'text/html; charset=utf-8')

  return new Response(body, {
    status: routesMeta[pathname] ? 200 : 404,
    headers,
  })
}
