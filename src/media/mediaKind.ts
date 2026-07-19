import type { MediaKind } from '../sources/types'

/**
 * Decides whether a stream is audio or video by asking the element.
 *
 * The anonymous Drive adapter supplies no MIME type and no filename, so this
 * is the only reliable signal. A decoded video track always reports a non-zero
 * `videoWidth`; an audio-only file reports zero. Valid only once readyState has
 * reached HAVE_METADATA.
 */
export function probeMediaKind(element: HTMLVideoElement): MediaKind {
  if (element.readyState < HTMLMediaElement.HAVE_METADATA) return 'unknown'
  return element.videoWidth > 0 ? 'video' : 'audio'
}
