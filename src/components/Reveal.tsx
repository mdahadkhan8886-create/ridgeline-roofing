import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ElementType, ReactNode } from 'react'

/**
 * Fades its content up as it scrolls into view. Content that is already on
 * screen when the page loads is never hidden, and without JavaScript nothing
 * is hidden at all.
 */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className,
  children,
  ...rest
}: {
  as?: ElementType
  delay?: number
  className?: string
  children: ReactNode
  id?: string
  'aria-labelledby'?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const [state, setState] = useState<'idle' | 'hidden' | 'shown'>('idle')

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.92) return // already visible: leave it alone

    setState('hidden')
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState('shown')
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const style: CSSProperties | undefined = state === 'shown' && delay ? { transitionDelay: `${delay}ms` } : undefined

  return (
    <Tag ref={ref} className={className} data-reveal={state === 'idle' ? undefined : state} style={style} {...rest}>
      {children}
    </Tag>
  )
}

/** Counts a number up from zero the first time it scrolls into view. */
export function CountUp({ value, decimals = 0, suffix = '', prefix = '' }: { value: number; decimals?: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const format = (n: number) =>
    `${prefix}${n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
  const [text, setText] = useState(format(value))

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      observer.disconnect()
      const start = performance.now()
      const duration = 1400
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        setText(format(value * eased))
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      setText(format(0))
      frame = requestAnimationFrame(tick)
    })
    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, suffix, prefix])

  return (
    <span ref={ref} aria-label={format(value)}>
      <span aria-hidden="true">{text}</span>
    </span>
  )
}
