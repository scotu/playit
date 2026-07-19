import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FolderEntryRow from './FolderEntryRow'
import type { FolderEntry } from '../sources/types'

const folder: FolderEntry = { id: 'f1', name: 'Sets', kind: 'folder', playable: false }
const audio: FolderEntry = {
  id: 'a1',
  name: 'Track.mp3',
  kind: 'file',
  mimeType: 'audio/mpeg',
  playable: true,
}
const pdf: FolderEntry = {
  id: 'p1',
  name: 'liner-notes.pdf',
  kind: 'file',
  mimeType: 'application/pdf',
  playable: false,
}
const sheet: FolderEntry = {
  id: 's1',
  name: 'Track notes',
  kind: 'file',
  mimeType: 'application/vnd.google-apps.spreadsheet',
  playable: false,
}

function renderRow(entry: FolderEntry, extra: Partial<Parameters<typeof FolderEntryRow>[0]> = {}) {
  return render(
    <FolderEntryRow entry={entry} onEnter={vi.fn()} onPlay={vi.fn()} {...extra} />,
  )
}

describe('FolderEntryRow', () => {
  it('enters a folder when its row is activated', async () => {
    const onEnter = vi.fn()
    const user = userEvent.setup()
    renderRow(folder, { onEnter })
    await user.click(screen.getByRole('button', { name: /sets/i }))
    expect(onEnter).toHaveBeenCalledWith(folder)
  })

  it('plays a playable file and offers a download', async () => {
    const onPlay = vi.fn()
    const user = userEvent.setup()
    renderRow(audio, { onPlay })
    await user.click(screen.getByRole('button', { name: /play track\.mp3/i }))
    expect(onPlay).toHaveBeenCalledWith(audio)
    expect(screen.getByRole('link', { name: /download track\.mp3/i })).toBeInTheDocument()
  })

  it('offers only download for a non-playable regular file', () => {
    renderRow(pdf)
    expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /download liner-notes\.pdf/i })).toBeInTheDocument()
  })

  it('offers Open in Drive for a Google-native file, not download', () => {
    renderRow(sheet)
    expect(screen.queryByRole('link', { name: /download/i })).not.toBeInTheDocument()
    const open = screen.getByRole('link', { name: /open .*in google drive/i })
    expect(open).toHaveAttribute('href', 'https://drive.google.com/file/d/s1/view')
  })

  it('marks the active entry for assistive tech', () => {
    renderRow(audio, { active: true })
    expect(screen.getByRole('button', { name: /play track\.mp3/i })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })
})
