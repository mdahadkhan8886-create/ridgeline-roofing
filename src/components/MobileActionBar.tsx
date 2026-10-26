import { useLocation } from '@tanstack/react-router'
import { site } from '#/config/site'

/** Call / estimate buttons pinned to the bottom of the screen on phones (homepage only). */
export function MobileActionBar() {
  const location = useLocation()
  if (location.pathname !== '/') return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-night/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
        <a href={site.company.phoneHref} className="btn btn-ghost min-h-12">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.6a1 1 0 01-.25 1z"
              fill="currentColor"
            />
          </svg>
          Call
        </a>
        <a href="#estimate" className="btn btn-primary min-h-12">
          Free estimate
        </a>
      </div>
    </div>
  )
}
