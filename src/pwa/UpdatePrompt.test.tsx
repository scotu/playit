import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UpdatePrompt from './UpdatePrompt'

describe('UpdatePrompt', () => {
  it('renders nothing when there is no update', () => {
    const { container } = render(
      <UpdatePrompt visible={false} onReload={vi.fn()} onDismiss={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('announces an available update with reload and dismiss actions', () => {
    render(<UpdatePrompt visible onReload={vi.fn()} onDismiss={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent(/new version/i)
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
  })

  it('calls onReload when the reload button is pressed', async () => {
    const onReload = vi.fn()
    const user = userEvent.setup()
    render(<UpdatePrompt visible onReload={onReload} onDismiss={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /reload/i }))
    expect(onReload).toHaveBeenCalledOnce()
  })

  it('calls onDismiss when the dismiss button is pressed', async () => {
    const onDismiss = vi.fn()
    const user = userEvent.setup()
    render(<UpdatePrompt visible onReload={vi.fn()} onDismiss={onDismiss} />)
    await user.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
