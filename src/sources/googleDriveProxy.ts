import { extractDriveFileId } from './googleDrive'
import { getDriveProxyBase } from '../config'
import { SourceError } from './types'
import type { SourceAdapter } from './types'

const ADAPTER_ID = 'google-drive-proxy'
const META_TIMEOUT_MS = 4000

interface DriveMeta {
  title?: string
  mimeType?: string
  size?: number
}

/** Best-effort metadata lookup. Never throws — a title is a nice-to-have. */
async function fetchMeta(base: string, fileId: string): Promise<DriveMeta | undefined> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), META_TIMEOUT_MS)
    const response = await fetch(`${base}/meta/${fileId}`, { signal: controller.signal })
    clearTimeout(timer)
    if (!response.ok) return undefined
    return (await response.json()) as DriveMeta
  } catch {
    return undefined
  }
}

/**
 * Plays public Drive files by routing them through the playit proxy Worker.
 *
 * The proxy exists because Google serves the anonymous Drive endpoint with
 * `Cross-Origin-Resource-Policy: same-site`, which browsers refuse to embed on a
 * cross-site page. The Worker refetches server-side (where CORP does not apply)
 * and re-emits the bytes with embeddable headers, so it can supply real metadata
 * too — hence `metadata: true`.
 */
export const googleDriveProxyAdapter: SourceAdapter = {
  id: ADAPTER_ID,
  label: 'Google Drive',
  capabilities: { metadata: true, auth: false },

  canHandle(input) {
    return extractDriveFileId(input) !== null
  },

  async resolve(input) {
    const fileId = extractDriveFileId(input)
    if (fileId === null) {
      throw new SourceError('unrecognised', 'That does not look like a Google Drive file link.')
    }

    const base = getDriveProxyBase()
    if (base === undefined) {
      throw new SourceError(
        'resolve-failed',
        'The playback proxy is not configured, so Google Drive files cannot be played yet.',
      )
    }

    const meta = await fetchMeta(base, fileId)
    return {
      streamUrl: `${base}/d/${fileId}`,
      adapterId: ADAPTER_ID,
      sourceUrl: input.trim(),
      kind: 'unknown',
      title: meta?.title,
      mimeType: meta?.mimeType,
    }
  },
}
