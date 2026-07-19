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
 * The anonymous streaming endpoint. Kept because the proxy Worker refetches this
 * exact URL server-side. It cannot be used directly from the browser: Google
 * serves it with `Cross-Origin-Resource-Policy: same-site`, which browsers refuse
 * to embed on a cross-site page. See `googleDriveProxy.ts`.
 */
export function buildDriveStreamUrl(fileId: string): string {
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`
}
