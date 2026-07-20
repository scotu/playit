import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './PlaylistSheet.module.css'

export interface PlaylistSheetProps {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
}

/**
 * The mobile playlist: a bottom sheet that slides up over the player, opened
 * from a control and dismissed by tapping the backdrop or the close control.
 * On desktop the docked `PlaylistSidebar` is used instead.
 */
export default function PlaylistSheet({ open, title, onClose, children }: PlaylistSheetProps) {
  return (
    <div className={`${styles.overlay} ${open ? styles.open : ''}`}>
      <button
        type="button"
        className={styles.backdrop}
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />
      <div className={styles.sheet} role="dialog" aria-label="Playlist" aria-hidden={!open}>
        <header className={styles.header}>
          <span className={styles.title}>{title ?? 'Playlist'}</span>
          <button type="button" className={styles.close} aria-label="Close playlist" onClick={onClose}>
            <ChevronDown className={styles.closeGlyph} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
