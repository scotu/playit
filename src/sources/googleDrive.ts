import type { SourceAdapter } from './types'
import { SourceError } from './types'

const FILE_ID = /[A-Za-z0-9_-]{25,44}/
const BARE_FILE_ID = new RegExp(`^${FILE_ID.source}$`)

/**
 * Patterns Google Drive hands out for a single file. Folder links are
 * deliberately absent — there is nothing to play.
 */
const URL_PATTERNS: RegExp[] = [
  new RegExp(`/file/d/(${FILE_ID.source})`),
  new RegExp(`[?&]id=(${FILE_ID.source})`),
]

const DRIVE_HOSTS = new Set([
  'drive.google.com',
  'drive.usercontent.google.com',
  'docs.google.com',
])

/** Extracts a Drive file id from any share URL shape, or a bare id. Null if it is not one. */
export function extractDriveFileId(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed === '') return null

  if (BARE_FILE_ID.test(trimmed)) return trimmed

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  if (!DRIVE_HOSTS.has(url.hostname)) return null

  const target = `${url.pathname}${url.search}`
  for (const pattern of URL_PATTERNS) {
    const match = target.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * The anonymous streaming endpoint. It honours Range requests, so seeking
 * works. `confirm=t` skips the virus-scan interstitial where Drive allows it;
 * sufficiently large files still fail and are surfaced as a playback error.
 */
export function buildDriveStreamUrl(fileId: string): string {
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`
}

/**
 * Plays "anyone with the link" Drive files with no API key and no sign-in.
 *
 * Trade-off, chosen deliberately: no key means no metadata (hence
 * `metadata: false` and `kind: 'unknown'`), and files large enough to trigger
 * Drive's virus-scan interstitial cannot be streamed at all. A keyed or
 * backend-proxied adapter would fix both and can be registered ahead of this one.
 */
export const googleDriveAnonymousAdapter: SourceAdapter = {
  id: 'google-drive-anonymous',
  label: 'Google Drive (public link)',
  capabilities: { metadata: false, auth: false },

  canHandle(input) {
    return extractDriveFileId(input) !== null
  },

  async resolve(input) {
    const fileId = extractDriveFileId(input)
    if (fileId === null) {
      throw new SourceError('unrecognised', 'That does not look like a Google Drive file link.')
    }
    return {
      streamUrl: buildDriveStreamUrl(fileId),
      adapterId: 'google-drive-anonymous',
      sourceUrl: input.trim(),
      kind: 'unknown',
    }
  },
}
