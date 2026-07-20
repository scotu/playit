import { Volume1, Volume2, VolumeX } from 'lucide-react'
import styles from './VolumeControl.module.css'

export interface VolumeControlProps {
  volume: number
  muted: boolean
  onVolume: (value: number) => void
  onToggleMute: () => void
}

export default function VolumeControl({
  volume,
  muted,
  onVolume,
  onToggleMute,
}: VolumeControlProps) {
  const effective = muted ? 0 : volume
  const VolumeIcon = effective === 0 ? VolumeX : effective < 0.5 ? Volume1 : Volume2
  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        <VolumeIcon className={styles.glyph} aria-hidden="true" />
      </button>
      <input
        className={styles.slider}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={effective}
        aria-label="Volume"
        onChange={(event) => onVolume(Number(event.target.value))}
      />
    </div>
  )
}
