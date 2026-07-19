import { useMemo } from 'react'
import type { FolderEntry } from '../sources/types'

export interface Playlist {
  current: FolderEntry | null
  nextEntry: FolderEntry | null
  prevEntry: FolderEntry | null
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Derives the play queue from a folder's entries. The queue is only the playable
 * files (folders and non-playable files are skipped), in document order. There
 * is no looping — the ends are hard stops.
 */
export function usePlaylist(entries: FolderEntry[], currentItemId: string | undefined): Playlist {
  return useMemo(() => {
    const playable = entries.filter((entry) => entry.playable)
    const index = playable.findIndex((entry) => entry.id === currentItemId)

    if (index === -1) {
      return { current: null, nextEntry: null, prevEntry: null, hasNext: false, hasPrev: false }
    }

    const nextEntry = playable[index + 1] ?? null
    const prevEntry = index > 0 ? playable[index - 1] : null

    return {
      current: playable[index],
      nextEntry,
      prevEntry,
      hasNext: nextEntry !== null,
      hasPrev: prevEntry !== null,
    }
  }, [entries, currentItemId])
}
