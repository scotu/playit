import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { MediaKind } from '../sources/types'
import { probeMediaKind } from './mediaKind'
import { describeMediaError } from './mediaError'
import type { PlaybackProblem } from './mediaError'

export type MediaStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface MediaState {
  kind: MediaKind
  status: MediaStatus
  playing: boolean
  currentTime: number
  duration: number
  bufferedEnd: number
  volume: number
  muted: boolean
  rate: number
  problem: PlaybackProblem | null
}

export interface MediaActions {
  toggle(): void
  play(): void
  pause(): void
  seekTo(seconds: number): void
  seekBy(delta: number): void
  setVolume(value: number): void
  toggleMute(): void
  setRate(value: number): void
  retry(): void
}

export interface UseMediaElementOptions {
  /** Seconds to jump to once metadata is available. */
  startAt?: number
  /** Used to tailor error copy to the source. */
  adapterId: string
}

const INITIAL: MediaState = {
  kind: 'unknown',
  status: 'loading',
  playing: false,
  currentTime: 0,
  duration: Number.NaN,
  bufferedEnd: 0,
  volume: 1,
  muted: false,
  rate: 1,
  problem: null,
}

export function useMediaElement(
  ref: RefObject<HTMLVideoElement | null>,
  options: UseMediaElementOptions,
): { state: MediaState; actions: MediaActions } {
  const { startAt, adapterId } = options
  const [state, setState] = useState<MediaState>(INITIAL)
  const startAppliedRef = useRef(false)

  const patch = useCallback((next: Partial<MediaState>) => {
    setState((current) => ({ ...current, ...next }))
  }, [])

  useEffect(() => {
    const element = ref.current
    if (element === null) return

    const onLoadedMetadata = () => {
      if (!startAppliedRef.current && startAt !== undefined && startAt > 0) {
        element.currentTime = Math.min(startAt, element.duration || startAt)
        startAppliedRef.current = true
      }
      patch({
        status: 'ready',
        kind: probeMediaKind(element),
        duration: element.duration,
        problem: null,
      })
    }

    const onTimeUpdate = () => patch({ currentTime: element.currentTime })
    const onDurationChange = () => patch({ duration: element.duration })
    const onPlay = () => patch({ playing: true })
    const onPause = () => patch({ playing: false })
    const onEnded = () => patch({ playing: false })
    const onWaiting = () => patch({ status: 'loading' })
    const onPlaying = () => patch({ status: 'ready', playing: true })
    const onRateChange = () => patch({ rate: element.playbackRate })
    const onVolumeChange = () => patch({ volume: element.volume, muted: element.muted })

    const onProgress = () => {
      const { buffered } = element
      patch({ bufferedEnd: buffered.length > 0 ? buffered.end(buffered.length - 1) : 0 })
    }

    const onError = () => {
      patch({
        status: 'error',
        playing: false,
        problem: describeMediaError(element.error, adapterId),
      })
    }

    const listeners: [string, EventListener][] = [
      ['loadedmetadata', onLoadedMetadata],
      ['timeupdate', onTimeUpdate],
      ['durationchange', onDurationChange],
      ['play', onPlay],
      ['pause', onPause],
      ['ended', onEnded],
      ['waiting', onWaiting],
      ['playing', onPlaying],
      ['ratechange', onRateChange],
      ['volumechange', onVolumeChange],
      ['progress', onProgress],
      ['error', onError],
    ]

    for (const [type, handler] of listeners) element.addEventListener(type, handler)
    return () => {
      for (const [type, handler] of listeners) element.removeEventListener(type, handler)
    }
  }, [ref, patch, startAt, adapterId])

  const seekTo = useCallback(
    (seconds: number) => {
      const element = ref.current
      if (element === null) return
      const max = Number.isFinite(element.duration) ? element.duration : seconds
      const target = Math.min(Math.max(0, seconds), max)
      element.currentTime = target
      patch({ currentTime: target })
    },
    [ref, patch],
  )

  const play = useCallback(() => {
    void ref.current?.play().catch(() => {
      // Autoplay rejection is expected before a gesture; the UI shows a play button.
    })
  }, [ref])

  const pause = useCallback(() => {
    ref.current?.pause()
  }, [ref])

  const toggle = useCallback(() => {
    const element = ref.current
    if (element === null) return
    if (element.paused) {
      void element.play().catch(() => {})
    } else {
      element.pause()
    }
  }, [ref])

  const seekBy = useCallback(
    (delta: number) => {
      const element = ref.current
      if (element === null) return
      seekTo(element.currentTime + delta)
    },
    [ref, seekTo],
  )

  const setVolume = useCallback(
    (value: number) => {
      const element = ref.current
      if (element === null) return
      const clamped = Math.min(Math.max(0, value), 1)
      element.volume = clamped
      element.muted = clamped === 0
    },
    [ref],
  )

  const toggleMute = useCallback(() => {
    const element = ref.current
    if (element === null) return
    element.muted = !element.muted
    patch({ muted: element.muted })
  }, [ref, patch])

  const setRate = useCallback(
    (value: number) => {
      const element = ref.current
      if (element === null) return
      element.playbackRate = value
    },
    [ref],
  )

  const retry = useCallback(() => {
    const element = ref.current
    if (element === null) return
    startAppliedRef.current = false
    patch({ status: 'loading', problem: null })
    element.load()
  }, [ref, patch])

  const actions: MediaActions = {
    play,
    pause,
    toggle,
    seekTo,
    seekBy,
    setVolume,
    toggleMute,
    setRate,
    retry,
  }

  return { state, actions }
}
