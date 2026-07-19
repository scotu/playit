import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { resolveSource } from '../sources/registry'
import { SourceError } from '../sources/types'
import type { ResolvedMedia } from '../sources/types'
import Player from '../player/Player'
import styles from './PlayScreen.module.css'

type Resolution =
  | { status: 'pending' }
  | { status: 'resolved'; media: ResolvedMedia }
  | { status: 'failed'; message: string }

const NO_SRC =
  'No link was provided. Add a Drive link to the address, or paste one on the home screen.'

export default function PlayScreen() {
  const [params] = useSearchParams()
  const src = params.get('src')
  const startAt = Number(params.get('t') ?? '')
  const [resolution, setResolution] = useState<Resolution>({ status: 'pending' })

  useEffect(() => {
    if (src === null || src.trim() === '') {
      setResolution({ status: 'failed', message: NO_SRC })
      return
    }

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
    return (
      <main className={styles.screen}>
        <div className={styles.problem}>
          <h1 className={styles.problemTitle}>That link could not be opened</h1>
          <p role="alert" className={styles.problemDetail}>
            {resolution.message}
          </p>
          <Link className={styles.back} to="/">
            Paste a different link
          </Link>
        </div>
      </main>
    )
  }

  return (
    <Player
      media={resolution.media}
      startAt={Number.isFinite(startAt) && startAt > 0 ? startAt : undefined}
    />
  )
}
