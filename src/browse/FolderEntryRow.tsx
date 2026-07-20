import { ChevronRight, ExternalLink, File, Film, Folder, Music } from 'lucide-react'
import type { ComponentType } from 'react'
import DownloadButton from './DownloadButton'
import type { FolderEntry } from '../sources/types'
import styles from './FolderEntryRow.module.css'

export interface FolderEntryRowProps {
  entry: FolderEntry
  onEnter: (entry: FolderEntry) => void
  onPlay: (entry: FolderEntry) => void
  /** True when this entry is the one currently playing. */
  active?: boolean
}

/** Google Docs/Sheets/Slides — real files, but not byte-downloadable or playable. */
function isGoogleNative(entry: FolderEntry): boolean {
  return entry.kind === 'file' && (entry.mimeType?.startsWith('application/vnd.google-apps.') ?? false)
}

function iconFor(entry: FolderEntry): ComponentType<{ className?: string }> {
  if (entry.kind === 'folder') return Folder
  if (entry.playable) return entry.mimeType?.startsWith('video/') ? Film : Music
  return File
}

export default function FolderEntryRow({ entry, onEnter, onPlay, active = false }: FolderEntryRowProps) {
  const Icon = iconFor(entry)
  const icon = <Icon className={styles.icon} aria-hidden="true" />

  if (entry.kind === 'folder') {
    return (
      <div className={styles.row}>
        <button type="button" className={styles.main} onClick={() => onEnter(entry)}>
          {icon}
          <span className={styles.name}>{entry.name}</span>
          <ChevronRight className={styles.chevron} aria-hidden="true" />
        </button>
      </div>
    )
  }

  const native = isGoogleNative(entry)

  return (
    <div className={`${styles.row} ${active ? styles.active : ''}`}>
      {entry.playable ? (
        <button
          type="button"
          className={styles.main}
          onClick={() => onPlay(entry)}
          aria-current={active ? 'true' : undefined}
          aria-label={`Play ${entry.name}`}
        >
          {icon}
          <span className={styles.name}>{entry.name}</span>
        </button>
      ) : (
        <div className={styles.mainStatic}>
          {icon}
          <span className={styles.name}>{entry.name}</span>
        </div>
      )}

      <div className={styles.actions}>
        {native ? (
          <a
            className={styles.open}
            href={`https://drive.google.com/file/d/${entry.id}/view`}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${entry.name} in Google Drive`}
          >
            <ExternalLink className={styles.openGlyph} aria-hidden="true" />
            <span className={styles.openLabel}>Open in Drive</span>
          </a>
        ) : (
          <DownloadButton id={entry.id} name={entry.name} iconOnly />
        )}
      </div>
    </div>
  )
}
