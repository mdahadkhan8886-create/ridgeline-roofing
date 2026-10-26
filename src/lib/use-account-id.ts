import { useEffect, useState } from 'react'

let request: Promise<string | null> | null = null

function fetchAccountId(): Promise<string | null> {
  if (!request) {
    request = fetch('/api/public-config')
      .then((r) => (r.ok ? r.json() : { accountId: null }))
      .then((data: { accountId?: string | null }) => data.accountId ?? null)
      .catch(() => {
        request = null
        return null
      })
  }
  return request
}

/** The Whop business ID (biz_…) the payment elements are mounted for. */
export function useAccountId(): { accountId: string | null; loading: boolean } {
  const [state, setState] = useState<{ accountId: string | null; loading: boolean }>({ accountId: null, loading: true })
  useEffect(() => {
    let active = true
    fetchAccountId().then((accountId) => {
      if (active) setState({ accountId, loading: false })
    })
    return () => {
      active = false
    }
  }, [])
  return state
}
