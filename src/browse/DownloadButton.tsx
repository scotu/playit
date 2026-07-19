import { getDriveProxyBase } from '../config'
import styles from './DownloadButton.module.css'

export interface DownloadButtonProps {
  id: string
  name: string
  /** Render as a compact icon (still labelled for assistive tech). */
  iconOnly?: boolean
}

/**
 * Downloads a Drive file through the proxy `/d/{id}` route. That response passes
 * Drive's `Content-Disposition: attachment` through, so the browser saves the
 * file (the same URL streams when used as a media `src`). Works for any file
 * type, playable or not. Renders nothing if the proxy is unconfigured.
 */
export default function DownloadButton({ id, name, iconOnly = false }: DownloadButtonProps) {
  const base = getDriveProxyBase()
  if (base === undefined) return null

  return (
    <a
      className={`${styles.button} ${iconOnly ? styles.icon : ''}`}
      href={`${base}/d/${id}`}
      download={name}
      title={`Download ${name}`}
      aria-label={`Download ${name}`}
      target="_blank"
      rel="noreferrer"
    >
      <span aria-hidden="true">⭳</span>
      {!iconOnly && <span className={styles.label}>Download</span>}
    </a>
  )
}
