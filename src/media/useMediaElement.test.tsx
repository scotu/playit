import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useRef } from 'react'
import { useMediaElement } from './useMediaElement'
import { MEDIA_ERROR } from './mediaError'

function Harness({ startAt }: { startAt?: number }) {
  const ref = useRef<HTMLVideoElement>(null)
  const { state, actions } = useMediaElement(ref, { startAt, adapterId: 'google-drive-proxy' })
  return (
    <div>
      <video ref={ref} src="https://media.test/file" data-testid="media" />
      <span data-testid="status">{state.status}</span>
      <span data-testid="kind">{state.kind}</span>
      <span data-testid="playing">{String(state.playing)}</span>
      <span data-testid="duration">{state.duration}</span>
      <span data-testid="time">{state.currentTime}</span>
      <span data-testid="problem">{state.problem?.title ?? ''}</span>
      <button onClick={actions.toggle}>toggle</button>
      <button onClick={() => actions.seekBy(5)}>forward</button>
      <button onClick={actions.toggleMute}>mute</button>
    </div>
  )
}

function media(): HTMLVideoElement {
  return screen.getByTestId('media') as HTMLVideoElement
}

function define(element: HTMLElement, prop: string, value: unknown) {
  Object.defineProperty(element, prop, { value, configurable: true, writable: true })
}

/** Fires an event the way the browser would, inside act(). */
function emit(element: HTMLElement, type: string) {
  act(() => {
    element.dispatchEvent(new Event(type))
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useMediaElement', () => {
  it('starts in the loading status', () => {
    render(<Harness />)
    expect(screen.getByTestId('status')).toHaveTextContent('loading')
  })

  it('becomes ready and reports duration and kind after metadata loads', () => {
    render(<Harness />)
    define(media(), 'readyState', 1)
    define(media(), 'videoWidth', 1920)
    define(media(), 'duration', 212)
    emit(media(), 'loadedmetadata')

    expect(screen.getByTestId('status')).toHaveTextContent('ready')
    expect(screen.getByTestId('kind')).toHaveTextContent('video')
    expect(screen.getByTestId('duration')).toHaveTextContent('212')
  })

  it('detects an audio-only stream when there is no video track', () => {
    render(<Harness />)
    define(media(), 'readyState', 1)
    define(media(), 'videoWidth', 0)
    define(media(), 'duration', 180)
    emit(media(), 'loadedmetadata')

    expect(screen.getByTestId('kind')).toHaveTextContent('audio')
  })

  it('tracks play and pause events', () => {
    render(<Harness />)
    emit(media(), 'play')
    expect(screen.getByTestId('playing')).toHaveTextContent('true')
    emit(media(), 'pause')
    expect(screen.getByTestId('playing')).toHaveTextContent('false')
  })

  it('follows timeupdate', () => {
    render(<Harness />)
    define(media(), 'currentTime', 42)
    emit(media(), 'timeupdate')
    expect(screen.getByTestId('time')).toHaveTextContent('42')
  })

  it('surfaces a playback problem on error', () => {
    render(<Harness />)
    define(media(), 'error', { code: MEDIA_ERROR.SRC_NOT_SUPPORTED })
    emit(media(), 'error')

    expect(screen.getByTestId('status')).toHaveTextContent('error')
    expect(screen.getByTestId('problem')).toHaveTextContent('This file could not be played')
  })

  it('seeks to the requested start offset once metadata is available', () => {
    render(<Harness startAt={90} />)
    define(media(), 'readyState', 1)
    define(media(), 'videoWidth', 640)
    define(media(), 'duration', 300)
    emit(media(), 'loadedmetadata')

    expect(media().currentTime).toBe(90)
  })

  it('clamps a seek to the duration', () => {
    render(<Harness />)
    define(media(), 'readyState', 1)
    define(media(), 'duration', 10)
    define(media(), 'videoWidth', 640)
    emit(media(), 'loadedmetadata')
    define(media(), 'currentTime', 8)
    emit(media(), 'timeupdate')

    act(() => {
      screen.getByText('forward').click()
    })
    expect(media().currentTime).toBe(10)
  })

  it('toggle calls play when paused', () => {
    render(<Harness />)
    define(media(), 'paused', true)
    act(() => {
      screen.getByText('toggle').click()
    })
    expect(media().play).toHaveBeenCalled()
  })

  it('toggles mute on the element', () => {
    render(<Harness />)
    act(() => {
      screen.getByText('mute').click()
    })
    expect(media().muted).toBe(true)
  })
})
