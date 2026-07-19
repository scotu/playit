import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router'
import HomeScreen from './HomeScreen'

const ID = '1AbC_dEfGhIjKlMnOpQrStUvWxYz01234'
const SHARE_URL = `https://drive.google.com/file/d/${ID}/view`

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/play" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HomeScreen', () => {
  it('disables the play button while the input is empty', () => {
    renderHome()
    expect(screen.getByRole('button', { name: /play/i })).toBeDisabled()
  })

  it('navigates to the play route with the encoded source', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.type(screen.getByRole('textbox'), SHARE_URL)
    await user.click(screen.getByRole('button', { name: /play/i }))

    expect(screen.getByTestId('location')).toHaveTextContent(
      `/play?src=${encodeURIComponent(SHARE_URL)}`,
    )
  })

  it('explains why an unsupported link will not work and blocks submission', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.type(screen.getByRole('textbox'), 'https://example.com/clip.mp4')

    expect(screen.getByRole('alert')).toHaveTextContent(/google drive/i)
    expect(screen.getByRole('button', { name: /play/i })).toBeDisabled()
  })

  it('does not show an error before anything has been typed', () => {
    renderHome()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
