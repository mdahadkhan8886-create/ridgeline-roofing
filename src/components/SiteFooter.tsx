import { Link } from '@tanstack/react-router'
import { site } from '#/config/site'
import { RoofMark } from '#/components/RoofMark'

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="on-dark bg-ink text-white/85">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 text-white">
            <RoofMark className="h-9 w-9" />
            <span className="heading text-xl">{site.company.name}</span>
          </div>
          <p className="measure mt-4 text-white/70">{site.company.intro}</p>
          <p className="mt-4 text-sm text-white/55">{site.company.license}</p>
        </div>

        <div>
          <h2 className="heading text-base text-white">Talk to us</h2>
          <ul className="mt-3 grid list-none gap-1.5 p-0">
            <li>
              <a className="text-white no-underline hover:underline" href={site.company.phoneHref}>
                {site.company.phone}
              </a>
            </li>
            <li>
              <a className="text-white no-underline hover:underline" href={`mailto:${site.company.email}`}>
                {site.company.email}
              </a>
            </li>
            <li className="text-white/70">{site.company.address}</li>
          </ul>
        </div>

        <div>
          <h2 className="heading text-base text-white">Book online</h2>
          <ul className="mt-3 grid list-none gap-1.5 p-0">
            <li>
              <Link to="/book/$planKey" params={{ planKey: 'inspection' }} className="text-white no-underline hover:underline">
                {site.plans.inspection.name}
              </Link>
            </li>
            <li>
              <Link to="/book/$planKey" params={{ planKey: 'flatRate' }} className="text-white no-underline hover:underline">
                {site.plans.flatRate.name}
              </Link>
            </li>
            <li>
              <Link to="/deposit" className="text-white no-underline hover:underline">
                {site.plans.deposit.name}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-white/55 sm:px-6">
          <p className="m-0">
            © {year} {site.company.name}. Payments are processed securely by Whop.
          </p>
          <Link to="/contractor" className="text-white/55 no-underline hover:text-white">
            Contractor login
          </Link>
        </div>
      </div>
    </footer>
  )
}
