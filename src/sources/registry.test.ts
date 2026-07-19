import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolveSource, canResolve, adapters } from './registry'
import { SourceError } from './types'
import type { SourceAdapter } from './types'

const ID = '1AbC_dEfGhIjKlMnOpQrStUvWxYz01234'
const SHARE_URL = `https://drive.google.com/file/d/${ID}/view?usp=sharing`

beforeEach(() => {
  vi.stubEnv('VITE_DRIVE_PROXY', 'https://proxy.test')
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ title: 'Song.mp3' }), { status: 200 })),
  )
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('resolveSource', () => {
  it('resolves a drive share link through the proxy adapter', async () => {
    const media = await resolveSource(SHARE_URL)
    expect(media.adapterId).toBe('google-drive-proxy')
    expect(media.streamUrl).toBe(`https://proxy.test/d/${ID}`)
    expect(media.sourceUrl).toBe(SHARE_URL)
  })

  it('reports kind as unknown because kind is decided at playback time', async () => {
    const media = await resolveSource(SHARE_URL)
    expect(media.kind).toBe('unknown')
  })

  it('throws an unrecognised SourceError for an unsupported input', async () => {
    await expect(resolveSource('https://example.com/clip.mp4')).rejects.toMatchObject({
      name: 'SourceError',
      code: 'unrecognised',
    })
  })

  it('picks the first adapter that claims the input', async () => {
    const first: SourceAdapter = {
      id: 'first',
      label: 'First',
      capabilities: { metadata: true, auth: false },
      canHandle: () => true,
      resolve: async (input) => ({
        streamUrl: 'https://first.test/stream',
        adapterId: 'first',
        sourceUrl: input,
        kind: 'audio',
      }),
    }
    const media = await resolveSource(SHARE_URL, [first, ...adapters])
    expect(media.adapterId).toBe('first')
  })

  it('wraps an adapter failure as a resolve-failed SourceError', async () => {
    const broken: SourceAdapter = {
      id: 'broken',
      label: 'Broken',
      capabilities: { metadata: false, auth: false },
      canHandle: () => true,
      resolve: async () => {
        throw new Error('upstream exploded')
      },
    }
    await expect(resolveSource('anything', [broken])).rejects.toBeInstanceOf(SourceError)
  })

  it('passes a SourceError from an adapter through unchanged', async () => {
    const picky: SourceAdapter = {
      id: 'picky',
      label: 'Picky',
      capabilities: { metadata: false, auth: false },
      canHandle: () => true,
      resolve: async () => {
        throw new SourceError('unrecognised', 'nope')
      },
    }
    await expect(resolveSource('anything', [picky])).rejects.toMatchObject({
      code: 'unrecognised',
    })
  })
})

describe('canResolve', () => {
  it('accepts a drive link', () => {
    expect(canResolve(SHARE_URL)).toBe(true)
  })

  it('rejects a non-drive link', () => {
    expect(canResolve('https://example.com/clip.mp4')).toBe(false)
  })

  it('rejects empty input', () => {
    expect(canResolve('   ')).toBe(false)
  })
})
