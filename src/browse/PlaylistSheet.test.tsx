import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlaylistSheet from './PlaylistSheet'

describe('PlaylistSheet', () => {
  it('exposes its content and title when open', () => {
    render(
      <PlaylistSheet open title="Sets" onClose={vi.fn()}>
        <p>entries</p>
      </PlaylistSheet>,
    )
    const dialog = screen.getByRole('dialog', { name: /playlist/i })
    expect(dialog).toHaveTextContent('Sets')
    expect(dialog).toHaveTextContent('entries')
  })

  it('calls onClose from the close button', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <PlaylistSheet open title="Sets" onClose={onClose}>
        <p>entries</p>
      </PlaylistSheet>,
    )
    await user.click(screen.getByRole('button', { name: /close playlist/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('is hidden from assistive tech when closed', () => {
    render(
      <PlaylistSheet open={false} title="Sets" onClose={vi.fn()}>
        <p>entries</p>
      </PlaylistSheet>,
    )
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
  })
})
