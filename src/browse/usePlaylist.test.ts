import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePlaylist } from './usePlaylist'
import type { FolderEntry } from '../sources/types'

const entries: FolderEntry[] = [
  { id: 'folder', name: 'Sub', kind: 'folder', playable: false },
  { id: 'a', name: 'A.mp3', kind: 'file', mimeType: 'audio/mpeg', playable: true },
  { id: 'sheet', name: 'Notes', kind: 'file', mimeType: 'application/vnd.google-apps.spreadsheet', playable: false },
  { id: 'b', name: 'B.mp3', kind: 'file', mimeType: 'audio/mpeg', playable: true },
]

describe('usePlaylist', () => {
  it('skips folders and non-playable files when finding the next track', () => {
    const { result } = renderHook(() => usePlaylist(entries, 'a'))
    expect(result.current.current?.id).toBe('a')
    expect(result.current.nextEntry?.id).toBe('b')
    expect(result.current.prevEntry).toBeNull()
    expect(result.current.hasNext).toBe(true)
    expect(result.current.hasPrev).toBe(false)
  })

  it('finds the previous playable track and stops at the end', () => {
    const { result } = renderHook(() => usePlaylist(entries, 'b'))
    expect(result.current.prevEntry?.id).toBe('a')
    expect(result.current.nextEntry).toBeNull()
    expect(result.current.hasNext).toBe(false)
    expect(result.current.hasPrev).toBe(true)
  })

  it('returns no neighbours when the current item is not in the list', () => {
    const { result } = renderHook(() => usePlaylist(entries, 'missing'))
    expect(result.current.current).toBeNull()
    expect(result.current.nextEntry).toBeNull()
    expect(result.current.prevEntry).toBeNull()
  })
})
