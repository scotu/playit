import { describe, it, expect } from 'vitest'
import { probeMediaKind } from './mediaKind'

function elementWith(readyState: number, videoWidth: number): HTMLVideoElement {
  const element = document.createElement('video')
  Object.defineProperty(element, 'readyState', { value: readyState, configurable: true })
  Object.defineProperty(element, 'videoWidth', { value: videoWidth, configurable: true })
  return element
}

describe('probeMediaKind', () => {
  it('returns unknown before metadata has loaded', () => {
    expect(probeMediaKind(elementWith(0, 0))).toBe('unknown')
  })

  it('returns video when the element reports a video track', () => {
    expect(probeMediaKind(elementWith(1, 1920))).toBe('video')
  })

  it('returns audio when metadata is loaded but there is no video track', () => {
    expect(probeMediaKind(elementWith(1, 0))).toBe('audio')
  })
})
