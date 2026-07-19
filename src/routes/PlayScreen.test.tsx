import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import PlayScreen from './PlayScreen'

const ID = '1AbC_dEfGhIjKlMnOpQrStUvWxYz01234'
const SHARE_URL = `https://drive.google.com/file/d/${ID}/view`

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/play" element={<PlayScreen />} />
        <Route path="/" element={<span data-testid="home" />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PlayScreen', () => {
  it('renders the player once a valid source resolves', async () => {
    renderAt(`/play?src=${encodeURIComponent(SHARE_URL)}`)
    expect(await screen.findByTestId('player')).toBeInTheDocument()
  })

  it('reports an unsupported source instead of rendering a player', async () => {
    renderAt(`/play?src=${encodeURIComponent('https://example.com/clip.mp4')}`)
    expect(await screen.findByRole('alert')).toHaveTextContent(/not supported/i)
    expect(screen.queryByTestId('player')).not.toBeInTheDocument()
  })

  it('prompts for a link when src is missing', async () => {
    renderAt('/play')
    expect(await screen.findByRole('alert')).toHaveTextContent(/no link/i)
  })
})
