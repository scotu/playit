import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SeekBar from './SeekBar'

describe('SeekBar', () => {
  // A native range input derives valuenow/valuemax from value/max, so those are
  // asserted as properties. Only valuetext is set explicitly — "30" means
  // nothing to a screen reader without "0:30 of 2:00".
  it('exposes progress to assistive technology', () => {
    render(<SeekBar currentTime={30} duration={120} bufferedEnd={60} onSeek={vi.fn()} />)
    const slider = screen.getByRole('slider', { name: /seek/i }) as HTMLInputElement
    expect(slider.value).toBe('30')
    expect(slider.max).toBe('120')
    expect(slider).toHaveAttribute('aria-valuetext', '0:30 of 2:00')
  })

  it('seeks to the value the slider reports', () => {
    const onSeek = vi.fn()
    render(<SeekBar currentTime={30} duration={120} bufferedEnd={60} onSeek={onSeek} />)
    fireEvent.change(screen.getByRole('slider', { name: /seek/i }), { target: { value: '75' } })
    expect(onSeek).toHaveBeenCalledWith(75)
  })

  it('disables itself while the duration is unknown', () => {
    render(<SeekBar currentTime={0} duration={Number.NaN} bufferedEnd={0} onSeek={vi.fn()} />)
    expect(screen.getByRole('slider', { name: /seek/i })).toBeDisabled()
  })
})
