import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import { site } from '#/config/site'
import { SiteHeader } from '#/components/SiteHeader'
import { SiteFooter } from '#/components/SiteFooter'
import { PixelDebug } from '#/components/PixelDebug'

import appCss from '../styles.css?url'

const description = `${site.company.name} — ${site.company.intro}`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: `${site.company.name} | Roof repair, replacement and inspections` },
      { name: 'description', content: description },
      { name: 'theme-color', content: site.theme.slate },
      { property: 'og:title', content: site.company.name },
      { property: 'og:description', content: site.company.tagline },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: `data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="6" fill="${site.theme.slate}"/><path d="M6 25 L20 12 L34 25" stroke="${site.theme.accent}" stroke-width="5" fill="none"/></svg>`,
        )}`,
      },
    ],
  }),
  shellComponent: RootDocument,
})

const brandVars = {
  '--rr-sky': site.theme.sky,
  '--rr-slate': site.theme.slate,
  '--rr-shingle': site.theme.shingle,
  '--rr-flashing': site.theme.flashing,
  '--rr-accent': site.theme.accent,
  '--rr-accent-ink': site.theme.accentInk,
} as CSSProperties

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={brandVars}>
      <head>
        <HeadContent />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <PixelDebug />
        <Scripts />
      </body>
    </html>
  )
}
