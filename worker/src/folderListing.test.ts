import { describe, it, expect } from 'vitest'
import { parseEmbeddedFolderView, selectFolderLister } from './folderListing'

// Trimmed from a real embeddedfolderview response: two subfolders, one audio
// file, and one non-playable Google spreadsheet.
// Mirrors the real embeddedfolderview markup: folders render a CSS-sprite icon
// and link to /drive/folders/{id}; files carry a drive-thirdparty type icon and
// link to /file/d/{id}.
const FIXTURE = `
<html><body><div id="folder-view">
<div class="flip-entry" id="entry-1D8fF43ju134SinCt-I5qLeNUAWSSBIKO" tabindex="0" role="link">
  <div class="flip-entry-info"><a href="https://drive.google.com/drive/folders/1D8fF43ju134SinCt-I5qLeNUAWSSBIKO" target="_blank">
  <div class="flip-entry-icon"><div aria-label="Folder" class="icon-color-1 drive-sprite-folder-grid-shared-icon"></div></div>
  <div class="flip-entry-title">Sets &amp; Mixes</div></a></div></div>
<div class="flip-entry" id="entry-1kGRudHHC468IjwGeBk0-uSpUpWMT_HLb" tabindex="0" role="link">
  <div class="flip-entry-info"><a href="https://drive.google.com/drive/folders/1kGRudHHC468IjwGeBk0-uSpUpWMT_HLb" target="_blank">
  <div class="flip-entry-icon"><div aria-label="Folder" class="icon-color-1 drive-sprite-folder-list-shared-icon"></div></div>
  <div class="flip-entry-title">Tracks</div></a></div></div>
<div class="flip-entry" id="entry-1zkbLpuOvNttTnOqM1_NhvbQyloRvm1O0" tabindex="0" role="link">
  <div class="flip-entry-info"><a href="https://drive.google.com/file/d/1zkbLpuOvNttTnOqM1_NhvbQyloRvm1O0/view?usp=drive_web">
  <div class="flip-entry-icon">
  <img src="https://drive-thirdparty.googleusercontent.com/128/type/audio/mpeg" alt="Audio"/></div></a></div>
  <div class="flip-entry-title">20231028 Matteo dj mix.mp3</div></div>
<div class="flip-entry" id="entry-1AbCsheet0000000000000000000000000" tabindex="0" role="link">
  <div class="flip-entry-info"><a href="https://drive.google.com/file/d/1AbCsheet0000000000000000000000000/view">
  <div class="flip-entry-icon">
  <img src="https://drive-thirdparty.googleusercontent.com/128/type/application/vnd.google-apps.spreadsheet" alt="Sheet"/></div></a></div>
  <div class="flip-entry-title">Track notes</div></div>
</div></body></html>
`

describe('parseEmbeddedFolderView', () => {
  it('returns entries in document order', () => {
    const entries = parseEmbeddedFolderView(FIXTURE)
    expect(entries.map((e) => e.name)).toEqual([
      'Sets & Mixes',
      'Tracks',
      '20231028 Matteo dj mix.mp3',
      'Track notes',
    ])
  })

  it('marks the Drive folder mime as a folder', () => {
    const [sets] = parseEmbeddedFolderView(FIXTURE)
    expect(sets).toMatchObject({
      id: '1D8fF43ju134SinCt-I5qLeNUAWSSBIKO',
      kind: 'folder',
      mimeType: 'application/vnd.google-apps.folder',
      playable: false,
    })
  })

  it('decodes HTML entities in names', () => {
    const [sets] = parseEmbeddedFolderView(FIXTURE)
    expect(sets.name).toBe('Sets & Mixes')
  })

  it('marks an audio file as a playable file', () => {
    const audio = parseEmbeddedFolderView(FIXTURE)[2]
    expect(audio).toMatchObject({
      id: '1zkbLpuOvNttTnOqM1_NhvbQyloRvm1O0',
      kind: 'file',
      mimeType: 'audio/mpeg',
      playable: true,
    })
  })

  it('treats a Google-native file as a non-playable file', () => {
    const sheet = parseEmbeddedFolderView(FIXTURE)[3]
    expect(sheet).toMatchObject({
      kind: 'file',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      playable: false,
    })
  })

  it('returns an empty array for HTML with no entries', () => {
    expect(parseEmbeddedFolderView('<html><body>nothing here</body></html>')).toEqual([])
    expect(parseEmbeddedFolderView('')).toEqual([])
  })
})

describe('selectFolderLister', () => {
  it('returns a scraper that fetches embeddedfolderview and parses it', async () => {
    const calls: string[] = []
    const fetchImpl = async (input: string | URL | Request) => {
      calls.push(input.toString())
      return new Response(FIXTURE, { status: 200 })
    }
    const list = selectFolderLister({})
    const entries = await list('1kGRudHHC468IjwGeBk0-uSpUpWMT_HLb', fetchImpl)

    expect(calls[0]).toContain('embeddedfolderview')
    expect(calls[0]).toContain('id=1kGRudHHC468IjwGeBk0-uSpUpWMT_HLb')
    expect(entries.length).toBe(4)
  })

  it('throws when the folder page is not reachable', async () => {
    const fetchImpl = async () => new Response('nope', { status: 404 })
    const list = selectFolderLister({})
    await expect(list('badfolder', fetchImpl)).rejects.toThrow()
  })
})
