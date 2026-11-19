import { useState } from 'react'
import { useStore } from 'zustand'
import type { KeyboardWishService } from '../keyboardWishService'
import {
  DEFAULT_TITLE,
  randomWishInput,
  type WishInput,
} from '../keyboardWishService'
import {
  MAX_CONFIG_SPAWN_LIMIT,
  saveConfig,
  type WallConfig,
} from '../config'
import { wallStore, type SpawnPosition } from '../wallStore'
import styles from './DevPanel.module.css'

interface DevPanelProps {
  service: KeyboardWishService
  config: WallConfig
  showSpawnPositions: boolean
  onShowSpawnPositionsChange: (visible: boolean) => void
}

export function DevPanel({
  service,
  config,
  showSpawnPositions,
  onShowSpawnPositionsChange,
}: DevPanelProps) {
  const arrival = useStore(wallStore, (state) => state.arrival)
  const spawnPositions = useStore(wallStore, (state) => state.spawnPositions)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [spawnLimit, setSpawnLimit] = useState(
    config.spawnLimit ?? MAX_CONFIG_SPAWN_LIMIT,
  )
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const updateSpawnPosition = (
    positionIndex: number,
    axis: keyof SpawnPosition,
    value: string,
  ) => {
    const nextValue = Number(value)
    if (!Number.isFinite(nextValue)) {
      return
    }

    const currentPosition = spawnPositions[positionIndex]
    if (!currentPosition) {
      return
    }

    wallStore.getState().setSpawnPosition(positionIndex, {
      ...currentPosition,
      [axis]: Math.min(100, Math.max(0, nextValue)),
    })
  }

  const setNextAvailablePosition = () => {
    const state = wallStore.getState()
    const currentSlots = state.slots
    const availableSlotIndex = currentSlots.findIndex(
      (wish, index) => index < spawnPositions.length && wish === null,
    )
    state.setNextSpawnPosition(
      availableSlotIndex === -1
        ? null
        : state.spawnPositions[availableSlotIndex],
    )
  }

  const submit = (input: WishInput) => {
    setNextAvailablePosition()
    const result = service.addWish(DEFAULT_TITLE, input.name, input.message)
    if (result.ok) {
      setName('')
      setMessage('')
      setError(null)
    } else {
      wallStore.getState().setNextSpawnPosition(null)
      setError(result.error)
    }
  }

  const fillWall = () => {
    const remaining = Math.max(0, spawnLimit - arrival.length)
    for (let i = 0; i < remaining; i++) {
      const input = randomWishInput()
      setNextAvailablePosition()
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

  const saveSettings = async () => {
    try {
      await saveConfig({
        ...config,
        spawnLimit,
        spawnPositions: wallStore.getState().spawnPositions,
      })
      setSaveStatus('Saved to config.json')
      setError(null)
    } catch (saveError) {
      setSaveStatus(null)
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save config',
      )
    }
  }

  const activeSpawnPositions = spawnPositions.slice(0, spawnLimit)

  return (
    <aside className={styles.panel}>
      <h2 className={styles.title}>Dev panel</h2>
      <details className={styles.foldout} open>
        <summary className={styles.foldoutSummary}>Wishes</summary>
        <div className={styles.foldoutContent}>
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
          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => submit({ title: DEFAULT_TITLE, name, message })}
            >
              Add wish
            </button>
            <button type="button" onClick={() => submit(randomWishInput())}>
              Random wish
            </button>
            <button type="button" onClick={fillWall}>
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
        </div>
      </details>
      <details className={styles.foldout}>
        <summary className={styles.foldoutSummary}>Settings</summary>
        <div className={styles.foldoutContent}>
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
              max={MAX_CONFIG_SPAWN_LIMIT}
              value={spawnLimit}
              onChange={(event) => {
                const nextLimit = Number(event.target.value)
                if (Number.isFinite(nextLimit)) {
                  setSpawnLimit(
                    Math.min(
                      MAX_CONFIG_SPAWN_LIMIT,
                      Math.max(1, Math.floor(nextLimit)),
                    ),
                  )
                  wallStore.getState().setCapacity(nextLimit)
                  setError(null)
                }
              }}
            />
          </label>
          <div className={styles.wishPositions}>
            <span className={styles.sectionLabel}>Available spawn positions</span>
            {activeSpawnPositions.map((position, index) => {
              return (
                <div className={styles.wishPosition} key={index}>
                  <span className={styles.wishLabel}>Position {index + 1}</span>
                  <label>
                    X
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={position.x}
                      onChange={(event) =>
                        updateSpawnPosition(index, 'x', event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Y
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={position.y}
                      onChange={(event) =>
                        updateSpawnPosition(index, 'y', event.target.value)
                      }
                    />
                  </label>
                </div>
              )
            })}
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showSpawnPositions}
              onChange={(event) =>
                onShowSpawnPositionsChange(event.target.checked)
              }
            />
            Show spawn position helper
          </label>
          <div className={styles.actions}>
            <button type="button" onClick={saveSettings}>
              Save config
            </button>
          </div>
        </div>
      </details>
      {saveStatus && <p className={styles.success}>{saveStatus}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </aside>
  )
}
