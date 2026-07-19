import { describe, it, expect, vi, afterEach } from 'vitest'
import { listDriveFolder } from './googleDriveFolder'
import { SourceError } from './types'

const FOLDER = '1v9FaRCdPaf8SPlaZGzCQgqbdU_YXqrmt'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('listDriveFolder', () => {
  it('requests the proxy /list route and returns the entries', async () => {
    vi.stubEnv('VITE_DRIVE_PROXY', 'https://proxy.test')
    const entries = [{ id: 'a', name: 'Song.mp3', kind: 'file', mimeType: 'audio/mpeg', playable: true }]
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ entries }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const listing = await listDriveFolder(FOLDER)

    expect(fetchMock).toHaveBeenCalledWith(`https://proxy.test/list/${FOLDER}`)
    expect(listing.folderId).toBe(FOLDER)
    expect(listing.entries).toEqual(entries)
  })

  it('throws a SourceError when the proxy is not configured', async () => {
    vi.stubEnv('VITE_DRIVE_PROXY', '')
    await expect(listDriveFolder(FOLDER)).rejects.toBeInstanceOf(SourceError)
  })

  it('throws a SourceError when the proxy returns an error status', async () => {
    vi.stubEnv('VITE_DRIVE_PROXY', 'https://proxy.test')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'list-failed' }), { status: 502 })),
    )
    await expect(listDriveFolder(FOLDER)).rejects.toMatchObject({ code: 'resolve-failed' })
  })

  it('throws a SourceError when the network fails', async () => {
    vi.stubEnv('VITE_DRIVE_PROXY', 'https://proxy.test')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )
    await expect(listDriveFolder(FOLDER)).rejects.toBeInstanceOf(SourceError)
  })
})
