import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import PlayScreen from './PlayScreen'
import type { FolderListing } from '../sources/types'

const ID = '1AbC_dEfGhIjKlMnOpQrStUvWxYz01234'
const FOLDER = '1v9FaRCdPaf8SPlaZGzCQgqbdU_YXqrmt'
const FILE_URL = `https://drive.google.com/file/d/${ID}/view`
const FOLDER_URL = `https://drive.google.com/drive/folders/${FOLDER}`

const listDriveFolder = vi.fn<(id: string) => Promise<FolderListing>>()
vi.mock('../sources/googleDriveFolder', () => ({
  listDriveFolder: (id: string) => listDriveFolder(id),
}))

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

beforeEach(() => {
  vi.clearAllMocks()
  listDriveFolder.mockResolvedValue({
    folderId: FOLDER,
    entries: [
      { id: 'sub', name: 'Sets', kind: 'folder', playable: false },
      { id: 'trk', name: 'Track.mp3', kind: 'file', mimeType: 'audio/mpeg', playable: true },
    ],
  })
})

describe('PlayScreen', () => {
  it('plays a single file link with a download control', async () => {
    renderAt(`/play?src=${encodeURIComponent(FILE_URL)}`)
    expect(await screen.findByTestId('player')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /download/i })).toBeInTheDocument()
  })

  it('browses a folder link full width (no player yet)', async () => {
    renderAt(`/play?src=${encodeURIComponent(FOLDER_URL)}`)
    expect(await screen.findByText('Track.mp3')).toBeInTheDocument()
    expect(screen.getByText('Sets')).toBeInTheDocument()
    expect(screen.queryByTestId('player')).not.toBeInTheDocument()
  })

  it('shows the player and sidebar once a folder item is selected', async () => {
    renderAt(`/play?src=${encodeURIComponent(FOLDER_URL)}&item=trk`)
    expect(await screen.findByTestId('player')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /playlist/i })).toBeInTheDocument()
  })

  it('prompts for a link when src is missing', async () => {
    renderAt('/play')
    expect(await screen.findByRole('alert')).toHaveTextContent(/no link/i)
  })
})
