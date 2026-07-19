import { getDriveProxyBase } from '../config'
import { SourceError } from './types'
import type { FolderEntry, FolderListing } from './types'

/**
 * Lists a public Drive folder through the proxy Worker's `/list/{folderId}`
 * route. The Worker decides how to list (keyless scrape today); the client only
 * sees uniform entries.
 */
export async function listDriveFolder(folderId: string): Promise<FolderListing> {
  const base = getDriveProxyBase()
  if (base === undefined) {
    throw new SourceError(
      'resolve-failed',
      'The playback proxy is not configured, so Google Drive folders cannot be browsed yet.',
    )
  }

  let response: Response
  try {
    response = await fetch(`${base}/list/${folderId}`)
  } catch {
    throw new SourceError('resolve-failed', 'Could not reach the playback proxy to list that folder.')
  }

  if (!response.ok) {
    throw new SourceError('resolve-failed', 'That folder could not be listed.')
  }

  const body = (await response.json()) as { entries?: FolderEntry[] }
  return { folderId, entries: body.entries ?? [] }
}
