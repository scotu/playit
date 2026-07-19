import { describe, it, expect } from 'vitest'
import { extractDriveFileId, buildDriveStreamUrl } from './googleDrive'

const ID = '1AbC_dEfGhIjKlMnOpQrStUvWxYz01234'

describe('extractDriveFileId', () => {
  it('reads the /file/d/{id}/view share link', () => {
    expect(extractDriveFileId(`https://drive.google.com/file/d/${ID}/view?usp=sharing`)).toBe(ID)
  })

  it('reads /file/d/{id} with no trailing segment', () => {
    expect(extractDriveFileId(`https://drive.google.com/file/d/${ID}`)).toBe(ID)
  })

  it('reads the open?id= form', () => {
    expect(extractDriveFileId(`https://drive.google.com/open?id=${ID}`)).toBe(ID)
  })

  it('reads the uc?export=download&id= form', () => {
    expect(extractDriveFileId(`https://drive.google.com/uc?export=download&id=${ID}`)).toBe(ID)
  })

  it('reads an already-resolved usercontent download url', () => {
    expect(
      extractDriveFileId(`https://drive.usercontent.google.com/download?id=${ID}&export=download`),
    ).toBe(ID)
  })

  it('accepts a bare file id', () => {
    expect(extractDriveFileId(ID)).toBe(ID)
  })

  it('tolerates surrounding whitespace', () => {
    expect(extractDriveFileId(`  https://drive.google.com/file/d/${ID}/view  `)).toBe(ID)
  })

  it('rejects a non-drive url', () => {
    expect(extractDriveFileId('https://example.com/video.mp4')).toBeNull()
  })

  it('rejects a drive folder link', () => {
    expect(
      extractDriveFileId('https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUv'),
    ).toBeNull()
  })

  it('rejects an empty or too-short input', () => {
    expect(extractDriveFileId('')).toBeNull()
    expect(extractDriveFileId('abc')).toBeNull()
  })
})

describe('buildDriveStreamUrl', () => {
  it('builds the anonymous usercontent download url with confirm bypass', () => {
    expect(buildDriveStreamUrl(ID)).toBe(
      `https://drive.usercontent.google.com/download?id=${ID}&export=download&confirm=t`,
    )
  })
})
