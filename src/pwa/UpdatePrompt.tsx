import styles from './UpdatePrompt.module.css'

export interface UpdatePromptProps {
  visible: boolean
  onReload: () => void
  onDismiss: () => void
}

/**
 * A toast shown when a newer build of the app is waiting. Presentational only —
 * the service-worker wiring lives in `PwaUpdater`.
 */
export default function UpdatePrompt({ visible, onReload, onDismiss }: UpdatePromptProps) {
  if (!visible) return null

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.message}>A new version is available.</span>
      <div className={styles.actions}>
        <button type="button" className={styles.reload} onClick={onReload}>
          Reload
        </button>
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          Later
        </button>
      </div>
    </div>
  )
}
