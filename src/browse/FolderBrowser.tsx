import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { listDriveFolder } from '../sources/googleDriveFolder'
import FolderEntryRow from './FolderEntryRow'
import type { FolderEntry } from '../sources/types'
import styles from './FolderBrowser.module.css'

export interface Crumb {
  id: string
  name: string
}

export interface FolderBrowserProps {
  folderId: string
  breadcrumbs: Crumb[]
  onEnter: (entry: FolderEntry) => void
  onPlay: (entry: FolderEntry) => void
  onCrumb: (index: number) => void
  /** Id of the entry currently playing, to highlight it. */
  activeItemId?: string
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; entries: FolderEntry[] }
  | { status: 'error'; message: string }

export default function FolderBrowser({
  folderId,
  breadcrumbs,
  onEnter,
  onPlay,
  onCrumb,
  activeItemId,
}: FolderBrowserProps) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    listDriveFolder(folderId)
      .then((listing) => {
        if (!cancelled) setState({ status: 'ready', entries: listing.entries })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'That folder could not be listed.'
        setState({ status: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [folderId])

  return (
    <div className={styles.browser}>
      <nav className={styles.crumbs} aria-label="Folder path">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          return (
            <span key={crumb.id} className={styles.crumb}>
              {isLast ? (
                <span aria-current="page" className={styles.crumbCurrent}>
                  {crumb.name}
                </span>
              ) : (
                <>
                  <button type="button" className={styles.crumbLink} onClick={() => onCrumb(index)}>
                    {crumb.name}
                  </button>
                  <ChevronRight className={styles.crumbSep} aria-hidden="true" />
                </>
              )}
            </span>
          )
        })}
      </nav>

      {state.status === 'loading' && <p className={styles.note}>Loading…</p>}

      {state.status === 'error' && (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      )}

      {state.status === 'ready' && state.entries.length === 0 && (
        <p className={styles.note}>This folder is empty.</p>
      )}

      {state.status === 'ready' && state.entries.length > 0 && (
        <ul className={styles.list}>
          {state.entries.map((entry) => (
            <li key={entry.id}>
              <FolderEntryRow
                entry={entry}
                onEnter={onEnter}
                onPlay={onPlay}
                active={entry.id === activeItemId}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
