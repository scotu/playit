import { useEffect } from 'react'
import type { MediaActions } from '../media/useMediaElement'

interface ShortcutOptions {
  actions: MediaActions
  duration: number
  volume: number
  onFullscreen: () => void
  onActivity: () => void
}

/** True when focus is somewhere that should receive the keystroke itself. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export function useKeyboardShortcuts({
  actions,
  duration,
  volume,
  onFullscreen,
  onActivity,
}: ShortcutOptions) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return

      const { key } = event

      if (key >= '0' && key <= '9' && Number.isFinite(duration)) {
        event.preventDefault()
        actions.seekTo((Number(key) / 10) * duration)
        onActivity()
        return
      }

      switch (key) {
        case ' ':
        case 'k':
          event.preventDefault()
          actions.toggle()
          break
        case 'ArrowRight':
          event.preventDefault()
          actions.seekBy(5)
          break
        case 'ArrowLeft':
          event.preventDefault()
          actions.seekBy(-5)
          break
        case 'ArrowUp':
          event.preventDefault()
          actions.setVolume(volume + 0.05)
          break
        case 'ArrowDown':
          event.preventDefault()
          actions.setVolume(volume - 0.05)
          break
        case 'm':
          actions.toggleMute()
          break
        case 'f':
          onFullscreen()
          break
        default:
          return
      }
      onActivity()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [actions, duration, volume, onFullscreen, onActivity])
}
