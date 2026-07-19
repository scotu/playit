import styles from './AudioStage.module.css'

export interface AudioStageProps {
  title?: string
  playing: boolean
}

export default function AudioStage({ title, playing }: AudioStageProps) {
  return (
    <div className={styles.stage} data-testid="audio-stage">
      <div className={`${styles.art} ${playing ? styles.pulsing : ''}`} aria-hidden="true">
        <div className={styles.disc} />
      </div>
      <p className={styles.title}>{title ?? 'Audio'}</p>
    </div>
  )
}
