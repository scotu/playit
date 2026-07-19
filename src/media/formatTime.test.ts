import { describe, it, expect } from 'vitest'
import { formatTime } from './formatTime'

describe('formatTime', () => {
  it('formats seconds under a minute with a leading zero minute', () => {
    expect(formatTime(7)).toBe('0:07')
  })

  it('formats minutes and seconds', () => {
    expect(formatTime(125)).toBe('2:05')
  })

  it('adds an hours segment past an hour and pads the minutes', () => {
    expect(formatTime(3661)).toBe('1:01:01')
  })

  it('renders a placeholder for unknown duration', () => {
    expect(formatTime(Number.NaN)).toBe('--:--')
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('--:--')
  })

  it('clamps negative input to zero', () => {
    expect(formatTime(-5)).toBe('0:00')
  })
})
