import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { resolveSource } from '../sources/registry'
import { parseDriveTarget } from '../sources/googleDrive'
import { SourceError } from '../sources/types'
import type { ResolvedMedia } from '../sources/types'
import Player from '../player/Player'
import FolderPlaylist from '../browse/FolderPlaylist'
import styles from './PlayScreen.module.css'

const NO_SRC =
  'No link was provided. Add a Drive link to the address, or paste one on the home screen.'

function Problem({ message }: { message: string }) {
  return (
    <main className={styles.screen}>
      <div className={styles.problem}>
        <h1 className={styles.problemTitle}>That link could not be opened</h1>
        <p role="alert" className={styles.problemDetail}>
          {message}
        </p>
        <Link className={styles.back} to="/">
          Paste a different link
        </Link>
      </div>
    </main>
  )
}

type Resolution =
  | { status: 'pending' }
  | { status: 'resolved'; media: ResolvedMedia }
  | { status: 'failed'; message: string }

/** Resolves and plays a single Drive file (the original behaviour, plus download). */
function FileResolver({ src, startAt }: { src: string; startAt?: number }) {
  const [resolution, setResolution] = useState<Resolution>({ status: 'pending' })

  useEffect(() => {
    let cancelled = false
    setResolution({ status: 'pending' })
    resolveSource(src)
      .then((media) => {
        if (!cancelled) setResolution({ status: 'resolved', media })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message =
          error instanceof SourceError ? error.message : 'That link could not be opened.'
        setResolution({ status: 'failed', message })
      })
    return () => {
      cancelled = true
    }
  }, [src])

  if (resolution.status === 'pending') {
    return (
      <main className={styles.screen}>
        <p className={styles.pending}>Opening…</p>
      </main>
    )
  }

  if (resolution.status === 'failed') {
    return <Problem message={resolution.message} />
  }

  return (
    <Player
      media={resolution.media}
      startAt={startAt}
      layout="fullscreen"
      downloadUrl={resolution.media.streamUrl}
    />
  )
}

export default function PlayScreen() {
  const [params] = useSearchParams()
  const src = params.get('src')
  const startAtRaw = Number(params.get('t') ?? '')
  const startAt = Number.isFinite(startAtRaw) && startAtRaw > 0 ? startAtRaw : undefined

  if (src === null || src.trim() === '') {
    return <Problem message={NO_SRC} />
  }

  const target = parseDriveTarget(src)

  if (target?.kind === 'folder') {
    return <FolderPlaylist rootFolderId={target.id} />
  }

  // A file link, or an unsupported link — the resolver plays it or shows why not.
  return <FileResolver src={src} startAt={startAt} />
}
