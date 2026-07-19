import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlaylistSidebar from './PlaylistSidebar'

beforeEach(() => {
  localStorage.clear()
})

describe('PlaylistSidebar', () => {
  it('shows its title and content when expanded', () => {
    render(
      <PlaylistSidebar title="Tracks">
        <p>entries here</p>
      </PlaylistSidebar>,
    )
    expect(screen.getByText('Tracks')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hide playlist/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('collapses and expands, persisting the choice', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <PlaylistSidebar title="Tracks">
        <p>entries here</p>
      </PlaylistSidebar>,
    )
    await user.click(screen.getByRole('button', { name: /hide playlist/i }))
    expect(screen.getByRole('button', { name: /show playlist/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(localStorage.getItem('playit.sidebar.collapsed')).toBe('true')

    // A fresh mount reads the persisted collapsed state.
    unmount()
    render(
      <PlaylistSidebar title="Tracks">
        <p>entries here</p>
      </PlaylistSidebar>,
    )
    expect(screen.getByRole('button', { name: /show playlist/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})
