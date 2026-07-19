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
  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {effective === 0 ? '🔇' : effective < 0.5 ? '🔉' : '🔊'}
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
