import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FolderBrowser from './FolderBrowser'
import type { FolderEntry, FolderListing } from '../sources/types'

const listDriveFolder = vi.fn<(id: string) => Promise<FolderListing>>()
vi.mock('../sources/googleDriveFolder', () => ({
  listDriveFolder: (id: string) => listDriveFolder(id),
}))

const entries: FolderEntry[] = [
  { id: 'f1', name: 'Sets', kind: 'folder', playable: false },
  { id: 'a1', name: 'Track.mp3', kind: 'file', mimeType: 'audio/mpeg', playable: true },
]

function renderBrowser(extra: Partial<Parameters<typeof FolderBrowser>[0]> = {}) {
  return render(
    <FolderBrowser
      folderId="root"
      breadcrumbs={[{ id: 'root', name: 'Library' }]}
      onEnter={vi.fn()}
      onPlay={vi.fn()}
      onCrumb={vi.fn()}
      {...extra}
    />,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  listDriveFolder.mockResolvedValue({ folderId: 'root', entries })
})

describe('FolderBrowser', () => {
  it('lists the folder entries once loaded', async () => {
    renderBrowser()
    expect(await screen.findByText('Sets')).toBeInTheDocument()
    expect(screen.getByText('Track.mp3')).toBeInTheDocument()
    expect(listDriveFolder).toHaveBeenCalledWith('root')
  })

  it('raises onEnter for a folder and onPlay for a playable file', async () => {
    const onEnter = vi.fn()
    const onPlay = vi.fn()
    const user = userEvent.setup()
    renderBrowser({ onEnter, onPlay })

    await user.click(await screen.findByRole('button', { name: /sets/i }))
    expect(onEnter).toHaveBeenCalledWith(entries[0])

    await user.click(screen.getByRole('button', { name: /play track\.mp3/i }))
    expect(onPlay).toHaveBeenCalledWith(entries[1])
  })

  it('shows an empty state for a folder with no entries', async () => {
    listDriveFolder.mockResolvedValue({ folderId: 'root', entries: [] })
    renderBrowser()
    expect(await screen.findByText(/empty/i)).toBeInTheDocument()
  })

  it('shows an error state when listing fails', async () => {
    listDriveFolder.mockRejectedValue(new Error('nope'))
    renderBrowser()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('renders clickable breadcrumbs', async () => {
    const onCrumb = vi.fn()
    const user = userEvent.setup()
    renderBrowser({
      breadcrumbs: [
        { id: 'root', name: 'Library' },
        { id: 'f1', name: 'Sets' },
      ],
      onCrumb,
    })
    await user.click(await screen.findByRole('button', { name: 'Library' }))
    expect(onCrumb).toHaveBeenCalledWith(0)
  })
})
