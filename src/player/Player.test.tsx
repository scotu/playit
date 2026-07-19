import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Player from './Player'
import { MEDIA_ERROR } from '../media/mediaError'
import type { ResolvedMedia } from '../sources/types'

const MEDIA: ResolvedMedia = {
  streamUrl: 'https://drive.usercontent.google.com/download?id=abc&export=download&confirm=t',
  adapterId: 'google-drive-proxy',
  sourceUrl: 'https://drive.google.com/file/d/abc/view',
  kind: 'unknown',
}

function renderPlayer() {
  return render(
    <MemoryRouter>
      <Player media={MEDIA} />
    </MemoryRouter>,
  )
}

function video(): HTMLVideoElement {
  return screen.getByTestId('media-element') as HTMLVideoElement
}

function define(element: HTMLElement, prop: string, value: unknown) {
  Object.defineProperty(element, prop, { value, configurable: true, writable: true })
}

function emit(element: HTMLElement, type: string) {
  act(() => {
    element.dispatchEvent(new Event(type))
  })
}

describe('Player', () => {
  it('points the media element at the resolved stream url', () => {
    renderPlayer()
    expect(video()).toHaveAttribute('src', MEDIA.streamUrl)
  })

  it('never sets crossorigin, which the anonymous drive endpoint rejects', () => {
    renderPlayer()
    expect(video()).not.toHaveAttribute('crossorigin')
  })

  it('shows the audio stage when the stream has no video track', () => {
    renderPlayer()
    define(video(), 'readyState', 1)
    define(video(), 'videoWidth', 0)
    define(video(), 'duration', 200)
    emit(video(), 'loadedmetadata')

    expect(screen.getByTestId('audio-stage')).toBeInTheDocument()
  })

  it('does not show the audio stage for a video stream', () => {
    renderPlayer()
    define(video(), 'readyState', 1)
    define(video(), 'videoWidth', 1280)
    define(video(), 'duration', 200)
    emit(video(), 'loadedmetadata')

    expect(screen.queryByTestId('audio-stage')).not.toBeInTheDocument()
  })

  it('replaces the controls with an actionable error stage on failure', () => {
    renderPlayer()
    define(video(), 'error', { code: MEDIA_ERROR.SRC_NOT_SUPPORTED })
    emit(video(), 'error')

    expect(screen.getByTestId('error-stage')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/anyone with the link/i)
    expect(screen.getByRole('link', { name: /open in google drive/i })).toHaveAttribute(
      'href',
      MEDIA.sourceUrl,
    )
  })

  it('exposes a working play control', () => {
    renderPlayer()
    define(video(), 'paused', true)
    act(() => {
      screen.getByRole('button', { name: 'Play' }).click()
    })
    expect(video().play).toHaveBeenCalled()
  })

  it('shows a download control only when a download url is given', () => {
    const { rerender } = render(
      <MemoryRouter>
        <Player media={MEDIA} />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('link', { name: /download/i })).not.toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <Player media={MEDIA} downloadUrl="https://proxy.test/d/abc" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /download/i })).toHaveAttribute(
      'href',
      'https://proxy.test/d/abc',
    )
  })

  it('advances via onEnded when the track finishes', () => {
    const onEnded = vi.fn()
    render(
      <MemoryRouter>
        <Player media={MEDIA} onEnded={onEnded} />
      </MemoryRouter>,
    )
    emit(video(), 'ended')
    expect(onEnded).toHaveBeenCalledOnce()
  })
})
