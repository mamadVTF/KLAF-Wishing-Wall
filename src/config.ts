import type { SpawnPosition } from './wallStore'

export interface WallConfig {
  qrUrl: string
  spawnLimit?: number
  spawnPositions?: SpawnPosition[]
}

export const MAX_CONFIG_SPAWN_LIMIT = 7

function parseSpawnPositions(value: unknown): SpawnPosition[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Wall config requires a non-empty "spawnPositions" array')
  }

  return value.map((position, index) => {
    if (typeof position !== 'object' || position === null) {
      throw new Error(`Wall config spawn position ${index + 1} is invalid`)
    }
    const record = position as Record<string, unknown>
    const x = record.x
    const y = record.y
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      x > 100 ||
      y < 0 ||
      y > 100
    ) {
      throw new Error(`Wall config spawn position ${index + 1} is invalid`)
    }
    return { x, y }
  })
}

export function parseConfig(raw: unknown): WallConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Wall config must be a JSON object')
  }
  const qrUrl = (raw as Record<string, unknown>).qrUrl
  if (typeof qrUrl !== 'string' || qrUrl.trim() === '') {
    throw new Error('Wall config requires a non-empty "qrUrl" string')
  }

  const record = raw as Record<string, unknown>
  const config: WallConfig = { qrUrl }
  if (record.spawnLimit !== undefined) {
    if (
      typeof record.spawnLimit !== 'number' ||
      !Number.isInteger(record.spawnLimit) ||
      record.spawnLimit < 1 ||
      record.spawnLimit > MAX_CONFIG_SPAWN_LIMIT
    ) {
      throw new Error(
        `Wall config spawnLimit must be an integer from 1 to ${MAX_CONFIG_SPAWN_LIMIT}`,
      )
    }
    config.spawnLimit = record.spawnLimit
  }
  if (record.spawnPositions !== undefined) {
    config.spawnPositions = parseSpawnPositions(record.spawnPositions)
  }
  return config
}

export async function loadConfig(): Promise<WallConfig> {
  const response = await fetch('/config.json')
  if (!response.ok) {
    throw new Error(`Failed to load config.json: ${response.status}`)
  }
  return parseConfig(await response.json())
}

export async function saveConfig(config: WallConfig): Promise<void> {
  const response = await fetch('/config.json', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config, null, 2),
  })
  if (!response.ok) {
    throw new Error(`Failed to save config.json: ${response.status}`)
  }
}
