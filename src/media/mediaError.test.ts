import { describe, it, expect } from 'vitest'
import { describeMediaError, MEDIA_ERROR } from './mediaError'

function mediaError(code: number): MediaError {
  return { code, message: '' } as MediaError
}

const DRIVE = 'google-drive-anonymous'

describe('describeMediaError', () => {
  it('explains a src-not-supported failure on drive as sharing or size', () => {
    const problem = describeMediaError(mediaError(MEDIA_ERROR.SRC_NOT_SUPPORTED), DRIVE)
    expect(problem.title).toBe('This file could not be played')
    expect(problem.detail).toMatch(/anyone with the link/i)
    expect(problem.hint).toMatch(/large/i)
    expect(problem.canRetry).toBe(false)
  })

  it('does not blame drive sharing for a non-drive adapter', () => {
    const problem = describeMediaError(mediaError(MEDIA_ERROR.SRC_NOT_SUPPORTED), 'other')
    expect(problem.detail).not.toMatch(/anyone with the link/i)
  })

  it('marks a network failure as retryable', () => {
    const problem = describeMediaError(mediaError(MEDIA_ERROR.NETWORK), DRIVE)
    expect(problem.canRetry).toBe(true)
  })

  it('marks a decode failure as not retryable', () => {
    const problem = describeMediaError(mediaError(MEDIA_ERROR.DECODE), DRIVE)
    expect(problem.title).toMatch(/format/i)
    expect(problem.canRetry).toBe(false)
  })

  it('treats an aborted load as retryable', () => {
    const problem = describeMediaError(mediaError(MEDIA_ERROR.ABORTED), DRIVE)
    expect(problem.canRetry).toBe(true)
  })

  it('falls back to a generic problem when there is no MediaError', () => {
    const problem = describeMediaError(null, DRIVE)
    expect(problem.title).toBeTruthy()
    expect(problem.canRetry).toBe(true)
  })
})
