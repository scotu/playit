import { useCallback, useRef, useState } from 'react'
import { useMediaElement } from '../media/useMediaElement'
import { useIdleChrome } from './useIdleChrome'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import ControlBar from './ControlBar'
import AudioStage from './AudioStage'
import ErrorStage from './ErrorStage'
import type { ResolvedMedia } from '../sources/types'
import styles from './Player.module.css'

export interface PlayerProps {
  media: ResolvedMedia
  startAt?: number
}

export default function Player({ media, startAt }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const [pipAvailable] = useState(() => document.pictureInPictureEnabled === true)

  const { state, actions } = useMediaElement(videoRef, {
    startAt,
    adapterId: media.adapterId,
  })

  const chromeActive = state.playing && state.status !== 'error'
  const { visible, notifyActivity } = useIdleChrome(chromeActive)

  const onFullscreen = useCallback(() => {
    const shell = shellRef.current
    if (shell === null) return
    if (document.fullscreenElement === null) {
      void shell.requestFullscreen?.().catch(() => {})
    } else {
      void document.exitFullscreen?.().catch(() => {})
    }
  }, [])

  const onPictureInPicture = useCallback(() => {
    const element = videoRef.current
    if (element === null) return
    if (document.pictureInPictureElement === null) {
      void element.requestPictureInPicture?.().catch(() => {})
    } else {
      void document.exitPictureInPicture?.().catch(() => {})
    }
  }, [])

  useKeyboardShortcuts({
    actions,
    duration: state.duration,
    volume: state.volume,
    onFullscreen,
    onActivity: notifyActivity,
  })

  const isAudio = state.kind === 'audio'
  const failed = state.status === 'error' && state.problem !== null

  return (
    <div
      ref={shellRef}
      className={`${styles.shell} ${visible ? '' : styles.idle}`}
      onPointerMove={notifyActivity}
      onPointerDown={notifyActivity}
      data-testid="player"
    >
      {/*
        A single element serves both audio and video: the anonymous adapter
        cannot tell us which we are getting, so we let the element decide.
        No crossorigin attribute — it would force a preflight Drive fails.
      */}
      <video
        ref={videoRef}
        className={`${styles.video} ${isAudio || failed ? styles.hidden : ''}`}
        src={media.streamUrl}
        poster={media.poster}
        preload="metadata"
        autoPlay
        playsInline
        data-testid="media-element"
        onClick={actions.toggle}
      />

      {isAudio && !failed && <AudioStage title={media.title} playing={state.playing} />}

      {failed && state.problem !== null && (
        <ErrorStage problem={state.problem} sourceUrl={media.sourceUrl} onRetry={actions.retry} />
      )}

      {!failed && (
        <div className={styles.chrome}>
          <ControlBar
            state={state}
            actions={actions}
            onFullscreen={onFullscreen}
            onPictureInPicture={onPictureInPicture}
            canPictureInPicture={pipAvailable && !isAudio}
          />
        </div>
      )}
    </div>
  )
}
