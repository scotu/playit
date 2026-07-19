import { Link } from 'react-router'
import type { PlaybackProblem } from '../media/mediaError'
import styles from './ErrorStage.module.css'

export interface ErrorStageProps {
  problem: PlaybackProblem
  sourceUrl: string
  onRetry: () => void
}

export default function ErrorStage({ problem, sourceUrl, onRetry }: ErrorStageProps) {
  return (
    <div className={styles.stage} data-testid="error-stage">
      <h1 className={styles.title}>{problem.title}</h1>
      <p className={styles.detail} role="alert">
        {problem.detail}
      </p>
      {problem.hint !== undefined && <p className={styles.hint}>{problem.hint}</p>}

      <div className={styles.actions}>
        {problem.canRetry && (
          <button type="button" className={styles.primary} onClick={onRetry}>
            Try again
          </button>
        )}
        <a className={styles.secondary} href={sourceUrl} target="_blank" rel="noreferrer">
          Open in Google Drive
        </a>
        <Link className={styles.secondary} to="/">
          Use a different link
        </Link>
      </div>
    </div>
  )
}
