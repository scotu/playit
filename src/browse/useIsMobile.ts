import { useEffect, useState } from 'react'

/** Tracks whether the viewport is at or below a width, updating on resize. */
export function useIsMobile(query = '(max-width: 760px)'): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])

  return matches
}
