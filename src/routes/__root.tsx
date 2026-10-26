import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import { site } from '#/config/site'
import { SiteHeader } from '#/components/SiteHeader'
import { SiteFooter } from '#/components/SiteFooter'
import { PixelDebug } from '#/components/PixelDebug'
import { MobileActionBar } from '#/components/MobileActionBar'

import appCss from '../styles.css?url'

const description = `${site.company.name} — ${site.company.intro}`
const ogImage = `${site.company.url.replace(/\/$/, '')}/og.png`

/** Search engines: who the business is, where it works, what it sells, and the FAQ. */
const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'RoofingContractor',
    name: site.company.name,
    url: site.company.url,
    image: ogImage,
    telephone: site.company.phone,
    email: site.company.email,
    foundingDate: String(site.company.foundedYear),
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.company.addressParts.street,
      addressLocality: site.company.addressParts.city,
      addressRegion: site.company.addressParts.region,
      postalCode: site.company.addressParts.postalCode,
      addressCountry: site.company.addressParts.country,
    },
    areaServed: site.serviceArea.towns.map((town) => ({ '@type': 'City', name: town })),
    makesOffer: Object.values(site.plans).map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.price,
      priceCurrency: 'USD',
      description: plan.description,
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: site.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  },
]

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: `${site.company.name} | Roof repair, replacement and inspections` },
      { name: 'description', content: description },
      { name: 'theme-color', content: site.theme.night },
      { name: 'color-scheme', content: 'dark' },
      { property: 'og:title', content: site.company.name },
      { property: 'og:description', content: site.company.tagline },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: site.company.url },
      { property: 'og:image', content: ogImage },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: site.company.name },
      { name: 'twitter:description', content: site.company.tagline },
      { name: 'twitter:image', content: ogImage },
    ],
    scripts: [{ type: 'application/ld+json', children: JSON.stringify(structuredData) }],
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
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="${site.theme.night}"/><path d="M6 25 L20 12 L34 25" stroke="${site.theme.accent}" stroke-width="5" fill="none"/></svg>`,
        )}`,
      },
    ],
  }),
  shellComponent: RootDocument,
})

const brandVars = {
  '--rr-night': site.theme.night,
  '--rr-surface': site.theme.surface,
  '--rr-raised': site.theme.raised,
  '--rr-line': site.theme.line,
  '--rr-text': site.theme.text,
  '--rr-muted': site.theme.muted,
  '--rr-accent': site.theme.accent,
  '--rr-accent2': site.theme.accent2,
  '--rr-accent-ink': site.theme.accentInk,
  '--rr-bolt': site.theme.bolt,
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
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-amber focus:px-4 focus:py-2 focus:text-on-amber"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <MobileActionBar />
        <PixelDebug />
        <Scripts />
      </body>
    </html>
  )
}
