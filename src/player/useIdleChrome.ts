import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Fades player chrome after a period of inactivity, but only while `active`
 * (i.e. playing). Paused or errored players keep their controls on screen.
 */
export function useIdleChrome(active: boolean, delayMs = 2500) {
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const arm = useCallback(() => {
    clear()
    timerRef.current = setTimeout(() => setVisible(false), delayMs)
  }, [clear, delayMs])

  const notifyActivity = useCallback(() => {
    setVisible(true)
    if (active) arm()
  }, [active, arm])

  useEffect(() => {
    if (!active) {
      clear()
      setVisible(true)
      return
    }
    arm()
    return clear
  }, [active, arm, clear])

  return { visible, notifyActivity }
}
