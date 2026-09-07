import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { loadConfig, type WallConfig } from './config'
import { KeyboardWishService } from './keyboardWishService'
import { WebSocketWishService } from './websocketWishService'
import { wallStore } from './wallStore'
import { Wall } from './components/Wall'
import { DevPanel } from './components/DevPanel'

type TransportMode = 'keyboard' | 'websocket'

const API_KEY = import.meta.env.VITE_API_KEY ?? ''
const PROJECT_CODE = import.meta.env.VITE_PROJECT_CODE ?? ''
const WISH_BASE_URL = import.meta.env.VITE_WISH_BASE_URL ?? ''
const DEFAULT_MODE: TransportMode =
  import.meta.env.VITE_TRANSPORT === 'websocket' ? 'websocket' : 'keyboard'

const switchStyle: CSSProperties = {
  position: 'fixed',
  top: 8,
  left: 8,
  zIndex: 10,
  display: 'flex',
  gap: 4,
}

function App() {
  const [config, setConfig] = useState<WallConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<TransportMode>(DEFAULT_MODE)

  const service = useMemo(() => {
    if (mode === 'websocket') {
      return new WebSocketWishService({
        apiKey: API_KEY,
        projectCode: PROJECT_CODE,
        baseUrl: WISH_BASE_URL,
      })
    }
    return new KeyboardWishService()
  }, [mode])

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : 'Failed to load the wall config',
        )
      })
  }, [])

  useEffect(() => {
    return wallStore.getState().connect(service)
  }, [service])

  if (error) {
    return <main>{error}</main>
  }

  if (!config) {
    return null
  }

  return (
    <>
      <Wall />
      {mode === 'keyboard' && (
        <DevPanel service={service as KeyboardWishService} />
      )}
    </>
  )
}

export default App
