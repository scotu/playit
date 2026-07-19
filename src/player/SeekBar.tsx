import { formatTime } from '../media/formatTime'
import styles from './SeekBar.module.css'

export interface SeekBarProps {
  currentTime: number
  duration: number
  bufferedEnd: number
  onSeek: (seconds: number) => void
}

export default function SeekBar({ currentTime, duration, bufferedEnd, onSeek }: SeekBarProps) {
  const known = Number.isFinite(duration) && duration > 0
  const played = known ? (currentTime / duration) * 100 : 0
  const buffered = known ? Math.min(100, (bufferedEnd / duration) * 100) : 0

  return (
    <div className={styles.wrapper}>
      <div className={styles.track} aria-hidden="true">
        <div className={styles.buffered} style={{ width: `${buffered}%` }} />
        <div className={styles.played} style={{ width: `${played}%` }} />
      </div>
      <input
        className={styles.input}
        type="range"
        min={0}
        max={known ? duration : 0}
        step="any"
        value={known ? currentTime : 0}
        disabled={!known}
        aria-label="Seek"
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        onChange={(event) => onSeek(Number(event.target.value))}
      />
    </div>
  )
}
