export interface PlaybackProblem {
  title: string
  detail: string
  /** Secondary line offering a next step. */
  hint?: string
  canRetry: boolean
}

const DRIVE_ADAPTER_ID = 'google-drive-proxy'

/**
 * MediaError codes as plain values.
 *
 * The spec defines these on the `MediaError` global, but jsdom does not
 * implement it, and depending on a DOM global for a pure mapping function is
 * needless coupling. These values are fixed by the HTML standard.
 */
export const MEDIA_ERROR = {
  ABORTED: 1,
  NETWORK: 2,
  DECODE: 3,
  SRC_NOT_SUPPORTED: 4,
} as const

/**
 * Turns a MediaError into something a person can act on.
 *
 * The important case is MEDIA_ERR_SRC_NOT_SUPPORTED on a Drive stream: the proxy
 * could not hand back playable bytes. That usually means the file is no longer
 * shared publicly, or it is large enough that Google served a virus-scan page the
 * proxy cannot get past. We cannot tell which apart, so we name both.
 */
export function describeMediaError(error: MediaError | null, adapterId: string): PlaybackProblem {
  if (error === null) {
    return {
      title: 'Playback stopped unexpectedly',
      detail: 'Something interrupted this file before it finished loading.',
      canRetry: true,
    }
  }

  switch (error.code) {
    case MEDIA_ERROR.ABORTED:
      return {
        title: 'Loading was cancelled',
        detail: 'The file stopped loading before playback could start.',
        canRetry: true,
      }

    case MEDIA_ERROR.NETWORK:
      return {
        title: 'The connection dropped',
        detail: 'The file was reachable but the download failed partway through.',
        hint: 'Check the connection and try again.',
        canRetry: true,
      }

    case MEDIA_ERROR.DECODE:
      return {
        title: 'This format is not supported',
        detail: 'The file downloaded, but this browser cannot decode it.',
        hint: 'Try a different browser, or convert the file to MP4 or MP3.',
        canRetry: false,
      }

    case MEDIA_ERROR.SRC_NOT_SUPPORTED:
      return adapterId === DRIVE_ADAPTER_ID
        ? {
            title: 'This file could not be played',
            detail:
              'The playback proxy could not return this file. Check that it is still shared with "anyone with the link".',
            hint: 'Very large files (roughly 100 MB and up) also cannot be streamed, because Google shows a virus-scan warning that requires signing in.',
            canRetry: false,
          }
        : {
            title: 'This file could not be played',
            detail: 'The source returned something that is not playable media.',
            canRetry: false,
          }

    default:
      return {
        title: 'Playback failed',
        detail: 'This file could not be played.',
        canRetry: true,
      }
  }
}
