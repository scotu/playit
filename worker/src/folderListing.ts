/**
 * Folder listing for the playit proxy.
 *
 * Today this scrapes Google's `embeddedfolderview` HTML — no API key, mirroring
 * the keyless file-streaming path. A future Drive-API lister (using a
 * server-side `GOOGLE_API_KEY` secret) will take precedence when the key exists;
 * `selectFolderLister` is the seam where that strategy plugs in.
 */

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export interface FolderEntry {
  id: string
  name: string
  kind: 'file' | 'folder'
  mimeType?: string
  /** True only for audio/* and video/* — the files the player can stream. */
  playable: boolean
}

export type FolderLister = (folderId: string, fetchImpl: FetchLike) => Promise<FolderEntry[]>

const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder'

const ENTRY_ID = /id="entry-([A-Za-z0-9_-]+)"/
// Files carry their real mime in the thirdparty icon URL; folders do not — they
// render a CSS sprite and link to /drive/folders/{id} instead of /file/d/{id}.
const ENTRY_MIME = /drive-thirdparty\.googleusercontent\.com\/\d+\/type\/([^"]+)"/
const ENTRY_TITLE = /flip-entry-title[^>]*>([^<]+)</
const IS_FOLDER = /\/drive\/folders\/|aria-label="Folder"/

/** Minimal HTML entity decode for the handful Google emits in file names. */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
}

/**
 * Parses an `embeddedfolderview` HTML page into folder entries, in the order
 * they appear. Each `flip-entry` block carries the id (`id="entry-{id}"`), the
 * mime type (in the icon URL `.../type/{mime}`), and the display name
 * (`flip-entry-title`).
 */
export function parseEmbeddedFolderView(html: string): FolderEntry[] {
  const blocks = html.split('class="flip-entry"').slice(1)
  const entries: FolderEntry[] = []

  for (const block of blocks) {
    const idMatch = block.match(ENTRY_ID)
    const titleMatch = block.match(ENTRY_TITLE)
    if (idMatch === null || titleMatch === null) continue

    const isFolder = IS_FOLDER.test(block)
    const mimeType = isFolder ? DRIVE_FOLDER_MIME : block.match(ENTRY_MIME)?.[1]

    entries.push({
      id: idMatch[1],
      name: decodeEntities(titleMatch[1]).trim(),
      kind: isFolder ? 'folder' : 'file',
      mimeType,
      playable: !isFolder && mimeType !== undefined && /^(audio|video)\//.test(mimeType),
    })
  }

  return entries
}

function embeddedFolderUrl(folderId: string): string {
  return `https://drive.google.com/embeddedfolderview?id=${folderId}#list`
}

const scrapeEmbeddedFolderView: FolderLister = async (folderId, fetchImpl) => {
  const response = await fetchImpl(embeddedFolderUrl(folderId), { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`Folder is not reachable (status ${response.status}).`)
  }
  return parseEmbeddedFolderView(await response.text())
}

/**
 * Chooses how to list a folder. Keyless scraping today; when a
 * `GOOGLE_API_KEY` secret is present, a Drive-API lister should be returned
 * here and take precedence. Kept as a seam per the plan — not yet implemented.
 */
export function selectFolderLister(_env: Record<string, unknown>): FolderLister {
  // TODO: if (typeof _env.GOOGLE_API_KEY === 'string') return driveApiLister(_env.GOOGLE_API_KEY)
  return scrapeEmbeddedFolderView
}
