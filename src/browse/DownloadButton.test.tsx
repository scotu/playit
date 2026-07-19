import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DownloadButton from './DownloadButton'

describe('DownloadButton', () => {
  it('links to the proxy download route for the file id', () => {
    render(<DownloadButton id="abc123" name="Song.mp3" />)
    const link = screen.getByRole('link', { name: /download song\.mp3/i })
    expect(link).toHaveAttribute('href', 'https://proxy.test/d/abc123')
    expect(link).toHaveAttribute('download')
  })

  it('supports an icon-only variant that keeps an accessible name', () => {
    render(<DownloadButton id="abc123" name="Song.mp3" iconOnly />)
    expect(screen.getByRole('link', { name: /download song\.mp3/i })).toBeInTheDocument()
  })
})
