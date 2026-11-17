import { useState } from 'react'
import { useStore } from 'zustand'
import type { KeyboardWishService } from '../keyboardWishService'
import {
  DEFAULT_TITLE,
  randomWishInput,
  type WishInput,
} from '../keyboardWishService'
import { WALL_CAPACITY, wallStore } from '../wallStore'
import styles from './DevPanel.module.css'

interface DevPanelProps {
  service: KeyboardWishService
}

export function DevPanel({ service }: DevPanelProps) {
  const arrival = useStore(wallStore, (state) => state.arrival)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [spawnLimit, setSpawnLimit] = useState(13)
  const [error, setError] = useState<string | null>(null)
  const canSpawn = arrival.length < spawnLimit

  const submit = (input: WishInput) => {
    if (!canSpawn) {
      setError(`Spawn limit reached (${spawnLimit})`)
      return
    }

    const result = service.addWish(DEFAULT_TITLE, input.name, input.message)
    if (result.ok) {
      setName('')
      setMessage('')
      setError(null)
    } else {
      setError(result.error)
    }
  }

  const fillWall = () => {
    const remaining = Math.max(0, spawnLimit - arrival.length)
    for (let i = 0; i < remaining; i++) {
      const input = randomWishInput()
      service.addWish(input.title, input.name, input.message)
    }

    if (remaining === 0) {
      setError(`Spawn limit reached (${spawnLimit})`)
    } else {
      setError(null)
    }
  }

  const removeLatestWish = () => {
    const latestWishId = arrival[arrival.length - 1]
    if (latestWishId) {
      service.removeWish(latestWishId)
    }
  }

  const clearAllWishes = () => {
    arrival.forEach((wishId) => service.removeWish(wishId))
    setError(null)
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
        <span className={styles.fieldLabel}>
          <span>Message</span>
          <span className={styles.spawnCount}>
            {message.length} / 50
          </span>
        </span>
        <textarea
          value={message}
          maxLength={50}
          rows={3}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>
          <span>Spawn limit</span>
          <span className={styles.spawnCount}>
            {arrival.length} / {spawnLimit}
          </span>
        </span>
        <input
          type="number"
          min={1}
          max={WALL_CAPACITY}
          value={spawnLimit}
          onChange={(event) => {
            const nextLimit = Number(event.target.value)
            if (Number.isFinite(nextLimit)) {
              setSpawnLimit(
                Math.min(WALL_CAPACITY, Math.max(1, Math.floor(nextLimit))),
              )
              setError(null)
            }
          }}
        />
      </label>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => submit({ title: DEFAULT_TITLE, name, message })}
          disabled={!canSpawn}
        >
          Add wish
        </button>
        <button
          type="button"
          onClick={() => submit(randomWishInput())}
          disabled={!canSpawn}
        >
          Random wish
        </button>
        <button type="button" onClick={fillWall} disabled={!canSpawn}>
          Fill wall
        </button>
        <button
          type="button"
          onClick={removeLatestWish}
          disabled={arrival.length === 0}
        >
          Remove wish
        </button>
        <button
          type="button"
          onClick={clearAllWishes}
          disabled={arrival.length === 0}
        >
          Clear all wishes
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </aside>
  )
}
