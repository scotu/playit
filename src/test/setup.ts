import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom does not implement HTMLMediaElement playback. Stub the surface the
// player touches so components can be tested without a real media pipeline.
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined),
})
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  configurable: true,
  value: vi.fn(),
})
Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  configurable: true,
  value: vi.fn(),
})
Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
  writable: true,
  configurable: true,
  value: 0,
})
Object.defineProperty(HTMLVideoElement.prototype, 'requestPictureInPicture', {
  writable: true,
  configurable: true,
  value: vi.fn().mockResolvedValue({}),
})
