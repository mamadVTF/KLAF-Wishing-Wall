import { useEffect, useState } from 'react'
import { loadConfig, type WallConfig } from './config'
import { KeyboardWishService } from './keyboardWishService'
import { wallStore } from './wallStore'
import { Wall } from './components/Wall'
import { DevPanel } from './components/DevPanel'

function App() {
  const [config, setConfig] = useState<WallConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [service] = useState(() => new KeyboardWishService())

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
      <Wall qrUrl={config.qrUrl} />
      <DevPanel service={service} />
    </>
  )
}

export default App