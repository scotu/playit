import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { canResolve } from '../sources/registry'
import { buildPlayUrl } from './playUrl'
import styles from './HomeScreen.module.css'

export default function HomeScreen() {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  const trimmed = value.trim()
  const isValid = canResolve(trimmed)
  const showError = trimmed !== '' && !isValid

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValid) return
    void navigate(buildPlayUrl(trimmed))
  }

  return (
    <main className={styles.screen}>
      <div className={styles.panel}>
        <h1 className={styles.title}>playit</h1>
        <p className={styles.subtitle}>
          Paste a Google Drive link to an audio or video file shared with anyone who has the link.
        </p>

        <form className={styles.form} onSubmit={onSubmit}>
          <input
            className={styles.input}
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://drive.google.com/file/d/…/view"
            aria-label="Google Drive link"
            autoComplete="off"
            spellCheck={false}
          />
          <button className={styles.submit} type="submit" disabled={!isValid}>
            Play
          </button>
        </form>

        {showError && (
          <p className={styles.error} role="alert">
            That link is not supported yet. Paste a Google Drive file link shared with anyone who
            has the link.
          </p>
        )}
      </div>
    </main>
  )
}
