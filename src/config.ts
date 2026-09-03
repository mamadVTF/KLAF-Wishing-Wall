export interface WallConfig {
  qrUrl: string
}

export function parseConfig(raw: unknown): WallConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Wall config must be a JSON object')
  }
  const qrUrl = (raw as Record<string, unknown>).qrUrl
  if (typeof qrUrl !== 'string' || qrUrl.trim() === '') {
    throw new Error('Wall config requires a non-empty "qrUrl" string')
  }
  return { qrUrl }
}

export async function loadConfig(): Promise<WallConfig> {
  const response = await fetch('/config.json')
  if (!response.ok) {
    throw new Error(`Failed to load config.json: ${response.status}`)
  }
  return parseConfig(await response.json())
}