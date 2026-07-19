import SeekBar from './SeekBar'
import VolumeControl from './VolumeControl'
import { formatTime } from '../media/formatTime'
import type { MediaActions, MediaState } from '../media/useMediaElement'
import styles from './ControlBar.module.css'

const RATES = [0.75, 1, 1.25, 1.5, 2]

export interface ControlBarProps {
  state: MediaState
  actions: MediaActions
  onFullscreen: () => void
  onPictureInPicture: () => void
  canPictureInPicture: boolean
  /** When set, shows a download control that saves the current file. */
  downloadUrl?: string
}

export default function ControlBar({
  state,
  actions,
  onFullscreen,
  onPictureInPicture,
  canPictureInPicture,
  downloadUrl,
}: ControlBarProps) {
  return (
    <div className={styles.bar}>
      <SeekBar
        currentTime={state.currentTime}
        duration={state.duration}
        bufferedEnd={state.bufferedEnd}
        onSeek={actions.seekTo}
      />

      <div className={styles.row}>
        <button
          type="button"
          className={styles.play}
          onClick={actions.toggle}
          aria-label={state.playing ? 'Pause' : 'Play'}
        >
          {state.playing ? '❚❚' : '▶'}
        </button>

        <span className={styles.time}>
          {formatTime(state.currentTime)} / {formatTime(state.duration)}
        </span>

        <div className={styles.spacer} />

        <VolumeControl
          volume={state.volume}
          muted={state.muted}
          onVolume={actions.setVolume}
          onToggleMute={actions.toggleMute}
        />

        <label className={styles.rate}>
          <span className={styles.visuallyHidden}>Playback speed</span>
          <select
            value={state.rate}
            onChange={(event) => actions.setRate(Number(event.target.value))}
          >
            {RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}×
              </option>
            ))}
          </select>
        </label>

        {downloadUrl !== undefined && (
          <a
            className={styles.icon}
            href={downloadUrl}
            download
            target="_blank"
            rel="noreferrer"
            aria-label="Download"
          >
            ⭳
          </a>
        )}

        {canPictureInPicture && (
          <button
            type="button"
            className={styles.icon}
            onClick={onPictureInPicture}
            aria-label="Picture in picture"
          >
            ⧉
          </button>
        )}

        <button type="button" className={styles.icon} onClick={onFullscreen} aria-label="Fullscreen">
          ⛶
        </button>
      </div>
    </div>
  )
}
