import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import styles from './PlaylistSidebar.module.css'

const STORAGE_KEY = 'playit.sidebar.collapsed'

export interface PlaylistSidebarProps {
  title?: string
  children: ReactNode
}

/**
 * The playlist pane while a track is playing: a collapsible side panel. The
 * content stays mounted when collapsed (hidden via CSS) so collapsing does not
 * refetch the folder. The collapsed choice persists across sessions.
 */
export default function PlaylistSidebar({ title, children }: PlaylistSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
      // Storage may be unavailable (private mode); the choice just won't persist.
    }
  }, [collapsed])

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Show playlist' : 'Hide playlist'}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? (
            <PanelRightOpen className={styles.toggleGlyph} aria-hidden="true" />
          ) : (
            <PanelRightClose className={styles.toggleGlyph} aria-hidden="true" />
          )}
        </button>
        {!collapsed && title !== undefined && <span className={styles.title}>{title}</span>}
      </header>

      <div className={styles.body} hidden={collapsed}>
        {children}
      </div>
    </aside>
  )
}
