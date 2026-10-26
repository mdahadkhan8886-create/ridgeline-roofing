import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { site } from '#/config/site'
import { RoofMark } from '#/components/RoofMark'

const NAV = [
  { href: '/#services', label: 'Services' },
  { href: '/#calculator', label: 'Cost calculator' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#projects', label: 'Projects' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/#contact', label: 'Contact' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-night/80 backdrop-blur-xl supports-[backdrop-filter]:bg-night/60">
      <div className="mx-auto flex h-18 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 text-fg no-underline" onClick={() => setOpen(false)}>
          <RoofMark className="h-9 w-9" />
          <span className="heading text-[1.2rem]">{site.company.name}</span>
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-5 xl:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="text-[0.95rem] font-semibold text-dim no-underline transition-colors hover:text-amber">
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href={site.company.phoneHref}
          className="ml-auto hidden font-bold text-fg no-underline hover:text-amber sm:inline xl:ml-0"
        >
          {site.company.phone}
        </a>
        <a href="/#estimate" className="btn btn-primary hidden min-h-11 px-4 py-2 text-[0.95rem] sm:inline-flex">
          Free estimate
        </a>

        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line text-fg sm:ml-0 xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" stroke="currentColor" strokeWidth="2.2" fill="none">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-line bg-night px-4 pb-5 pt-2 xl:hidden">
          <ul className="m-0 grid list-none gap-1 p-0">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-3 text-lg font-semibold text-fg no-underline hover:bg-surface"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2 sm:hidden">
            <a href="/#estimate" onClick={() => setOpen(false)} className="btn btn-primary">
              Free estimate
            </a>
            <a href={site.company.phoneHref} className="btn btn-ghost">
              Call {site.company.phone}
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}
