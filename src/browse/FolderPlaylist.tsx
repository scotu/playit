import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getDriveProxyBase } from '../config'
import { listDriveFolder } from '../sources/googleDriveFolder'
import { usePlaylist } from './usePlaylist'
import { useIsMobile } from './useIsMobile'
import FolderBrowser from './FolderBrowser'
import type { Crumb } from './FolderBrowser'
import PlaylistSidebar from './PlaylistSidebar'
import PlaylistSheet from './PlaylistSheet'
import Player from '../player/Player'
import type { FolderEntry, ResolvedMedia } from '../sources/types'
import styles from '../routes/PlayScreen.module.css'

export interface FolderPlaylistProps {
  rootFolderId: string
}

/** Builds a ResolvedMedia for a file id, titled from its folder entry if known. */
function fileMedia(id: string, entry: FolderEntry | undefined): ResolvedMedia | null {
  const base = getDriveProxyBase()
  if (base === undefined) return null
  return {
    streamUrl: `${base}/d/${id}`,
    adapterId: 'google-drive-proxy',
    sourceUrl: `https://drive.google.com/file/d/${id}/view`,
    kind: 'unknown',
    title: entry?.name,
    mimeType: entry?.mimeType,
  }
}

const ROOT_CRUMB = 'Library'

/**
 * Folder mode: browse a Drive folder full width, and once a track is chosen,
 * show the player beside a collapsible playlist sidebar. `folder` (the viewed
 * folder) and `item` (the playing file) live in the URL; the auto-advance queue
 * is the folder the playing item was launched from.
 */
export default function FolderPlaylist({ rootFolderId }: FolderPlaylistProps) {
  const [params, setParams] = useSearchParams()
  const shownFolderId = params.get('folder') ?? rootFolderId
  const item = params.get('item') ?? undefined

  const [path, setPath] = useState<Crumb[]>(() =>
    shownFolderId === rootFolderId
      ? [{ id: rootFolderId, name: ROOT_CRUMB }]
      : [
          { id: rootFolderId, name: ROOT_CRUMB },
          { id: shownFolderId, name: 'Folder' },
        ],
  )

  // Keep breadcrumbs consistent with the shown folder, including on back/forward.
  useEffect(() => {
    setPath((prev) => {
      const index = prev.findIndex((crumb) => crumb.id === shownFolderId)
      if (index !== -1) return prev.slice(0, index + 1)
      if (shownFolderId === rootFolderId) return [{ id: rootFolderId, name: ROOT_CRUMB }]
      return [...prev, { id: shownFolderId, name: 'Folder' }]
    })
  }, [shownFolderId, rootFolderId])

  const [queueFolderId, setQueueFolderId] = useState<string>(shownFolderId)
  const [queueEntries, setQueueEntries] = useState<FolderEntry[]>([])
  const isMobile = useIsMobile()
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (item === undefined) return
    let cancelled = false
    listDriveFolder(queueFolderId)
      .then((listing) => {
        if (!cancelled) setQueueEntries(listing.entries)
      })
      .catch(() => {
        if (!cancelled) setQueueEntries([])
      })
    return () => {
      cancelled = true
    }
  }, [item, queueFolderId])

  const playlist = usePlaylist(queueEntries, item)

  const updateParams = useCallback(
    (next: Record<string, string | undefined>) => {
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(next)) {
            if (value === undefined) updated.delete(key)
            else updated.set(key, value)
          }
          return updated
        },
        { replace: false },
      )
    },
    [setParams],
  )

  const onEnter = useCallback(
    (entry: FolderEntry) => {
      setPath((prev) => [...prev, { id: entry.id, name: entry.name }])
      updateParams({ folder: entry.id })
    },
    [updateParams],
  )

  const onCrumb = useCallback(
    (index: number) => {
      updateParams({ folder: index === 0 ? undefined : path[index].id })
    },
    [path, updateParams],
  )

  const onPlay = useCallback(
    (entry: FolderEntry) => {
      setQueueFolderId(shownFolderId)
      updateParams({ item: entry.id, folder: shownFolderId })
    },
    [shownFolderId, updateParams],
  )

  const goNext = useCallback(() => {
    if (playlist.nextEntry !== null) updateParams({ item: playlist.nextEntry.id })
  }, [playlist.nextEntry, updateParams])

  const browser = (
    <FolderBrowser
      folderId={shownFolderId}
      breadcrumbs={path}
      onEnter={onEnter}
      onPlay={onPlay}
      onCrumb={onCrumb}
      activeItemId={item}
    />
  )

  const media = item !== undefined ? fileMedia(item, queueEntries.find((e) => e.id === item)) : null

  if (item === undefined || media === null) {
    return <div className={styles.browse}>{browser}</div>
  }

  const currentName = path[path.length - 1]?.name

  // Mobile: player fills the screen; the playlist is a bottom sheet opened from
  // the control bar.
  if (isMobile) {
    return (
      <div className={styles.stageFull}>
        <Player
          key={media.streamUrl}
          media={media}
          layout="fullscreen"
          onEnded={goNext}
          downloadUrl={media.streamUrl}
          onTogglePlaylist={() => setSheetOpen(true)}
        />
        <PlaylistSheet open={sheetOpen} title={currentName} onClose={() => setSheetOpen(false)}>
          {browser}
        </PlaylistSheet>
      </div>
    )
  }

  // Desktop: player beside the docked, collapsible playlist.
  return (
    <div className={styles.paned}>
      <div className={styles.stage}>
        <Player
          key={media.streamUrl}
          media={media}
          layout="paned"
          onEnded={goNext}
          downloadUrl={media.streamUrl}
        />
      </div>
      <PlaylistSidebar title={currentName}>{browser}</PlaylistSidebar>
    </div>
  )
}
