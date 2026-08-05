#!/usr/bin/env node
/**
 * Extract route metadata from src/router/index.js and generate:
 * 1. functions/_shared/routes-meta.json — consumed by the edge middleware
 * 2. public/sitemap.xml — committed static sitemap
 *
 * Runs automatically via the prebuild npm hook; can also run standalone:
 *   node scripts/generate-routes-meta.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROUTER_FILE = join(ROOT, 'src/router/index.js')
const META_OUT = join(ROOT, 'functions/_shared/routes-meta.json')
const SITEMAP_OUT = join(ROOT, 'public/sitemap.xml')
const SITE = 'https://vvzzv.com'

const source = readFileSync(ROUTER_FILE, 'utf-8')

const ROUTE_RE =
  /path:\s*'([^']+)'[\s\S]*?meta:\s*\{\s*title:\s*'((?:[^'\\]|\\.)*)',\s*description:\s*'((?:[^'\\]|\\.)*)'/g

const routes = {}
let match
while ((match = ROUTE_RE.exec(source)) !== null) {
  const [, path, title, description] = match
  if (path.includes(':')) continue
  routes[path] = { title, description }
}

const paths = Object.keys(routes)
if (paths.length < 20) {
  console.error(`只提取到 ${paths.length} 条路由，疑似解析失败，已中止`)
  process.exit(1)
}

writeFileSync(META_OUT, JSON.stringify(routes, null, 2) + '\n')

const today = new Date().toISOString().slice(0, 10)
const urls = paths
  .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))
  .map((p) => {
    const priority = p === '/' ? '1.0' : '0.8'
    return (
      `  <url><loc>${SITE}${p === '/' ? '' : p}</loc>` +
      `<lastmod>${today}</lastmod>` +
      `<changefreq>${p === '/' ? 'weekly' : 'monthly'}</changefreq>` +
      `<priority>${priority}</priority></url>`
    )
  })
  .join('\n')

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
writeFileSync(SITEMAP_OUT, sitemap)

console.log(`routes-meta.json: ${paths.length} 条路由`)
console.log(`sitemap.xml: ${paths.length} 个 URL，lastmod=${today}`)
