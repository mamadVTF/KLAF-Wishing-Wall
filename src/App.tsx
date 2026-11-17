import { useEffect, useMemo, useState } from 'react'
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

const GRID_CELL_SIZE = 64.8


function App() {
  const [config, setConfig] = useState<WallConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDevPanel, setShowDevPanel] = useState(false)
  const mode = DEFAULT_MODE;

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

  useEffect(() => {
    wallStore.getState().startFocusRotation()
    wallStore.getState().startFlavorRotation()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        setShowDevPanel((visible) => !visible)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const updateGridHeight = () => {
      const topBand = window.innerHeight * 0.05
      const availableHeight = window.innerHeight - topBand * 2
      const completeRows = Math.floor(availableHeight / GRID_CELL_SIZE)

      document.documentElement.style.setProperty('--grid-top', `${topBand}px`)
      document.documentElement.style.setProperty(
        '--grid-height',
        `${completeRows * GRID_CELL_SIZE}px`,
      )
    }

    updateGridHeight()
    window.addEventListener('resize', updateGridHeight)
    return () => window.removeEventListener('resize', updateGridHeight)
  }, [])

  if (error) {
    return <main>{error}</main>
  }

  if (!config) {
    return null
  }

  return (
    <>
      <Wall />
      {mode === 'keyboard' && showDevPanel && (
        <DevPanel service={service as KeyboardWishService} />
      )}
    </>
  )
}

export default App
