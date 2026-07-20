import '@testing-library/jest-dom/vitest'
import { vi, beforeEach } from 'vitest'

// This jsdom build ships without Web Storage. Provide a minimal in-memory
// localStorage so components that persist small preferences work under test.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>()
  const memoryStorage: Storage = {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => store.set(key, String(value)),
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage,
    configurable: true,
  })
}

// jsdom does not implement matchMedia. Default every query to "no match" so
// responsive hooks resolve to the desktop layout under test.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// The Drive adapter does a best-effort meta fetch during resolve. Default it to a
// harmless stub so tests that resolve a source don't touch the network; tests
// that care about metadata override global fetch themselves.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ title: undefined }), { status: 200 })),
  )
})

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
