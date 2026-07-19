import { describe, it, expect } from 'vitest'
import {
  extractDriveFileId,
  extractDriveFolderId,
  parseDriveTarget,
  buildDriveStreamUrl,
} from './googleDrive'

const ID = '1AbC_dEfGhIjKlMnOpQrStUvWxYz01234'
const FOLDER = '1v9FaRCdPaf8SPlaZGzCQgqbdU_YXqrmt'

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

describe('extractDriveFolderId', () => {
  it('reads a /drive/folders/{id} link', () => {
    expect(extractDriveFolderId(`https://drive.google.com/drive/folders/${FOLDER}?usp=drive_link`)).toBe(
      FOLDER,
    )
  })

  it('reads a /drive/u/0/folders/{id} link', () => {
    expect(extractDriveFolderId(`https://drive.google.com/drive/u/0/folders/${FOLDER}`)).toBe(FOLDER)
  })

  it('reads a folderview?id= link', () => {
    expect(extractDriveFolderId(`https://drive.google.com/folderview?id=${FOLDER}`)).toBe(FOLDER)
  })

  it('rejects a file link', () => {
    expect(extractDriveFolderId(`https://drive.google.com/file/d/${ID}/view`)).toBeNull()
  })

  it('rejects a non-drive link', () => {
    expect(extractDriveFolderId('https://example.com/folder')).toBeNull()
  })
})

describe('parseDriveTarget', () => {
  it('classifies a folder link as a folder', () => {
    expect(parseDriveTarget(`https://drive.google.com/drive/folders/${FOLDER}`)).toEqual({
      kind: 'folder',
      id: FOLDER,
    })
  })

  it('classifies a file link as a file', () => {
    expect(parseDriveTarget(`https://drive.google.com/file/d/${ID}/view`)).toEqual({
      kind: 'file',
      id: ID,
    })
  })

  it('returns null for an unsupported input', () => {
    expect(parseDriveTarget('https://example.com/clip.mp4')).toBeNull()
  })
})
