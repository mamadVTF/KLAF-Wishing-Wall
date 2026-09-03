import { useState } from 'react'
import type { KeyboardWishService } from '../keyboardWishService'
import { randomWishInput, type WishInput } from '../keyboardWishService'
import styles from './DevPanel.module.css'

interface DevPanelProps {
  service: KeyboardWishService
}

export function DevPanel({ service }: DevPanelProps) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (input: WishInput) => {
    const result = service.addWish(input.name, input.message)
    if (result.ok) {
      setName('')
      setMessage('')
      setError(null)
    } else {
      setError(result.error)
    }
  }

  const fillWall = () => {
    for (let i = 0; i < 12; i++) {
      const input = randomWishInput()
      service.addWish(input.name, input.message)
    }
  }

  return (
    <aside className={styles.panel}>
      <h2 className={styles.title}>Dev panel</h2>
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
        <button type="button" onClick={() => submit({ name, message })}>
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