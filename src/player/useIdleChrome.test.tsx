import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useIdleChrome } from './useIdleChrome'

function Harness({ active }: { active: boolean }) {
  const { visible, notifyActivity } = useIdleChrome(active, 2500)
  return (
    <div>
      <span data-testid="visible">{String(visible)}</span>
      <button onClick={notifyActivity}>poke</button>
    </div>
  )
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useIdleChrome', () => {
  it('starts visible', () => {
    render(<Harness active />)
    expect(screen.getByTestId('visible')).toHaveTextContent('true')
  })

  it('hides after the idle delay while active', () => {
    render(<Harness active />)
    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(screen.getByTestId('visible')).toHaveTextContent('false')
  })

  it('stays visible when not active', () => {
    render(<Harness active={false} />)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByTestId('visible')).toHaveTextContent('true')
  })

  it('reappears and restarts the timer on activity', () => {
    render(<Harness active />)
    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(screen.getByTestId('visible')).toHaveTextContent('false')

    act(() => {
      screen.getByText('poke').click()
    })
    expect(screen.getByTestId('visible')).toHaveTextContent('true')

    act(() => {
      vi.advanceTimersByTime(2400)
    })
    expect(screen.getByTestId('visible')).toHaveTextContent('true')
  })
})
