/** Logo mark: a ridgeline with a chimney. Inherits text color. */
export function RoofMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" fill="none">
      <path d="M3 25 L20 9 L37 25" stroke="currentColor" strokeWidth="4.5" strokeLinecap="square" />
      <path d="M28 12.5 V7 H32.5 V16.8" stroke="currentColor" strokeWidth="3.5" />
      <path d="M9 30 H31" stroke="var(--rr-accent)" strokeWidth="4.5" />
    </svg>
  )
}
