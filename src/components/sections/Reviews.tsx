import { site } from '#/config/site'

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
          <path
            d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"
            fill={i < count ? 'var(--rr-accent)' : 'none'}
            stroke="var(--rr-slate)"
            strokeWidth="1.2"
          />
        </svg>
      ))}
    </span>
  )
}

export function Reviews() {
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-18 sm:px-6 md:py-24">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div>
            <h2 id="reviews-title" className="display m-0 text-[clamp(2rem,4.5vw,3.2rem)]">
              What homeowners say
            </h2>
            <ul className="mt-8 grid list-none gap-3 p-0">
              {site.trust.map((item) => (
                <li key={item} className="flex items-start gap-3 font-semibold">
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 flex-none" aria-hidden="true">
                    <path d="M12 2.5l8 3v6c0 5-3.4 8.8-8 10-4.6-1.2-8-5-8-10v-6z" fill="var(--rr-slate)" />
                    <path d="M8 12l3 3 5-6" stroke="var(--rr-accent)" strokeWidth="2.4" fill="none" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            {site.reviews.areSamples && (
              <p className="mt-8 text-sm text-muted">Sample reviews for this template. Replace them with your own in the site config.</p>
            )}
          </div>

          <div className="grid gap-0">
            {site.reviews.items.map((review, i) => (
              <figure key={review.name} className={`m-0 py-7 ${i > 0 ? 'border-t border-rule' : 'pt-0 md:pt-2'}`}>
                <Stars count={review.stars} />
                <blockquote className="m-0 mt-3 text-[1.2rem] leading-relaxed text-ink">“{review.text}”</blockquote>
                <figcaption className="mt-3 text-[0.95rem] text-muted">
                  <span className="font-bold text-ink">{review.name}</span>, {review.town} — {review.job}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
