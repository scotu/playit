import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const updateServiceWorker = vi.fn()
const setNeedRefresh = vi.fn()
let needRefresh = false

// The real hook comes from vite-plugin-pwa's virtual module, which only exists in
// a Vite build. Mock it so the container can be tested in isolation.
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  }),
}))

import PwaUpdater from './PwaUpdater'

beforeEach(() => {
  vi.clearAllMocks()
  needRefresh = false
})

describe('PwaUpdater', () => {
  it('shows nothing when no update is waiting', () => {
    render(<PwaUpdater />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('prompts when a new service worker is waiting', () => {
    needRefresh = true
    render(<PwaUpdater />)
    expect(screen.getByRole('status')).toHaveTextContent(/new version/i)
  })

  it('activates the waiting worker and reloads when Reload is pressed', async () => {
    needRefresh = true
    const user = userEvent.setup()
    render(<PwaUpdater />)
    await user.click(screen.getByRole('button', { name: /reload/i }))
    // true tells vite-plugin-pwa to skip waiting and reload the page.
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('clears the prompt without reloading when dismissed', async () => {
    needRefresh = true
    const user = userEvent.setup()
    render(<PwaUpdater />)
    await user.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(setNeedRefresh).toHaveBeenCalledWith(false)
    expect(updateServiceWorker).not.toHaveBeenCalled()
  })
})
