import { useState } from 'react'
import type { KeyboardWishService } from '../keyboardWishService'
import {
  DEFAULT_TITLE,
  randomWishInput,
  type WishInput,
} from '../keyboardWishService'
import styles from './DevPanel.module.css'

interface DevPanelProps {
  service: KeyboardWishService
}

export function DevPanel({ service }: DevPanelProps) {
  const [title, setTitle] = useState(DEFAULT_TITLE)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (input: WishInput) => {
    const result = service.addWish(input.title, input.name, input.message)
    if (result.ok) {
      setTitle(DEFAULT_TITLE)
      setName('')
      setMessage('')
      setError(null)
    } else {
      setError(result.error)
    }
  }

  const fillWall = () => {
    for (let i = 0; i < 13; i++) {
      const input = randomWishInput()
      service.addWish(input.title, input.name, input.message)
    }
  }

  return (
    <aside className={styles.panel}>
      <h2 className={styles.title}>Dev panel</h2>
      <label className={styles.field}>
        Title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className={styles.field}>
        Name
        <input
          value={name}
          maxLength={30}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className={styles.field}>
        Message
        <input
          value={message}
          maxLength={140}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <div className={styles.actions}>
        <button type="button" onClick={() => submit({ title, name, message })}>
          Add wish
        </button>
        <button
          type="button"
          onClick={() => submit(randomWishInput())}
        >
          Random wish
        </button>
        <button type="button" onClick={fillWall}>
          Fill wall
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </aside>
  )
}