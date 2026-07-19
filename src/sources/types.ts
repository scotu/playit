export type MediaKind = 'audio' | 'video' | 'unknown'

export interface ResolvedMedia {
  /** URL to hand to the media element. */
  streamUrl: string
  /** Which adapter produced this. */
  adapterId: string
  /** The original input, kept so the UI can link back to it. */
  sourceUrl: string
  /** Known ahead of playback only when the adapter has metadata capability. */
  kind: MediaKind
  title?: string
  mimeType?: string
  poster?: string
}

export interface SourceAdapter {
  id: string
  label: string
  capabilities: {
    /** True when the adapter can supply title/mimeType before playback. */
    metadata: boolean
    /** True when the adapter needs a signed-in user or a server-held key. */
    auth: boolean
  }
  canHandle(input: string): boolean
  resolve(input: string): Promise<ResolvedMedia>
}

/** One item inside a Drive folder listing. Mirrors the Worker's shape. */
export interface FolderEntry {
  id: string
  name: string
  kind: 'file' | 'folder'
  mimeType?: string
  /** True only for audio/* and video/* — what the player can stream. */
  playable: boolean
}

export interface FolderListing {
  folderId: string
  entries: FolderEntry[]
}

export type SourceErrorCode = 'unrecognised' | 'resolve-failed'

export class SourceError extends Error {
  readonly code: SourceErrorCode

  constructor(code: SourceErrorCode, message: string) {
    super(message)
    this.name = 'SourceError'
    this.code = code
  }
}
