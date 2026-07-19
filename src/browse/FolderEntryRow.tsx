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

function iconFor(entry: FolderEntry): string {
  if (entry.kind === 'folder') return '📁'
  if (entry.playable) return entry.mimeType?.startsWith('video/') ? '🎬' : '🎵'
  if (isGoogleNative(entry)) return '📄'
  return '📄'
}

export default function FolderEntryRow({ entry, onEnter, onPlay, active = false }: FolderEntryRowProps) {
  const icon = <span className={styles.icon} aria-hidden="true">{iconFor(entry)}</span>

  if (entry.kind === 'folder') {
    return (
      <div className={styles.row}>
        <button type="button" className={styles.main} onClick={() => onEnter(entry)}>
          {icon}
          <span className={styles.name}>{entry.name}</span>
          <span className={styles.chevron} aria-hidden="true">›</span>
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
            Open in Drive
          </a>
        ) : (
          <DownloadButton id={entry.id} name={entry.name} iconOnly />
        )}
      </div>
    </div>
  )
}
