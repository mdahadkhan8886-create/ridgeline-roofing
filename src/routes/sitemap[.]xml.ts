import { createFileRoute } from '@tanstack/react-router'

const PATHS = ['/', '/book/inspection', '/book/flatRate', '/deposit']

// /sitemap.xml, built from the address the site is served at.
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin.replace(/^http:/, 'https:')
        const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
        const base = host && !/^(localhost|127\.)/.test(host) ? `https://${host}` : origin
        const urls = PATHS.map((p) => `  <url><loc>${base}${p}</loc></url>`).join('\n')
        return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
          headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
        })
      },
    },
  },
})
