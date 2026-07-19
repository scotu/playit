import { describe, it, expect, vi, afterEach } from 'vitest'
import { googleDriveProxyAdapter } from './googleDriveProxy'
import { SourceError } from './types'

const ID = '1AbC_dEfGhIjKlMnOpQrStUvWxYz01234'
const SHARE_URL = `https://drive.google.com/file/d/${ID}/view`

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

function stubMeta(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status: ok ? 200 : 500 })),
  )
}

describe('googleDriveProxyAdapter', () => {
  it('claims any google drive link', () => {
    expect(googleDriveProxyAdapter.canHandle(SHARE_URL)).toBe(true)
    expect(googleDriveProxyAdapter.canHandle('https://example.com/x.mp4')).toBe(false)
  })

  it('builds the stream url from the configured proxy base', async () => {
    vi.stubEnv('VITE_DRIVE_PROXY', 'https://proxy.test')
    stubMeta({ title: 'Song.mp3', mimeType: 'audio/mpeg', size: 100 })

    const media = await googleDriveProxyAdapter.resolve(SHARE_URL)
    expect(media.adapterId).toBe('google-drive-proxy')
    expect(media.streamUrl).toBe(`https://proxy.test/d/${ID}`)
    expect(media.sourceUrl).toBe(SHARE_URL)
  })

  it('enriches the result with the title and mime type from the meta route', async () => {
    vi.stubEnv('VITE_DRIVE_PROXY', 'https://proxy.test/')
    stubMeta({ title: 'Song.mp3', mimeType: 'audio/mpeg', size: 100 })

    const media = await googleDriveProxyAdapter.resolve(SHARE_URL)
    expect(media.title).toBe('Song.mp3')
    expect(media.mimeType).toBe('audio/mpeg')
    // A trailing slash in the base must not double up.
    expect(media.streamUrl).toBe(`https://proxy.test/d/${ID}`)
  })

  it('still resolves a stream url when the meta lookup fails', async () => {
    vi.stubEnv('VITE_DRIVE_PROXY', 'https://proxy.test')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )

    const media = await googleDriveProxyAdapter.resolve(SHARE_URL)
    expect(media.streamUrl).toBe(`https://proxy.test/d/${ID}`)
    expect(media.title).toBeUndefined()
  })

  it('reports a clear error when no proxy is configured', async () => {
    vi.stubEnv('VITE_DRIVE_PROXY', '')
    await expect(googleDriveProxyAdapter.resolve(SHARE_URL)).rejects.toMatchObject({
      name: 'SourceError',
      code: 'resolve-failed',
    })
    await expect(googleDriveProxyAdapter.resolve(SHARE_URL)).rejects.toThrow(/proxy/i)
  })

  it('rejects a non-drive input as unrecognised', async () => {
    vi.stubEnv('VITE_DRIVE_PROXY', 'https://proxy.test')
    await expect(googleDriveProxyAdapter.resolve('https://example.com/x.mp4')).rejects.toBeInstanceOf(
      SourceError,
    )
  })
})
