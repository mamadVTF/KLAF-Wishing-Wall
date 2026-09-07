import type {
  IWishService,
  Unsubscribe,
  Wish,
  WishEventHandlers,
} from './transport'

export interface WebSocketWishServiceOptions {
  /** API key for the wishing-wall API (third-party read/write). */
  apiKey: string
  /** The wall's `project_code` (a row's `code` in the `projects` table). */
  projectCode?: string
  /** Optional API origin. Empty = same origin (relative URLs). */
  baseUrl?: string
}

/** Reconnection delay in milliseconds after the socket drops. */
export const RECONNECT_DELAY_MS = 2000

/** Default wall project code used when none is supplied. */
export const DEFAULT_PROJECT_CODE = 'maggi20260910'

/** Map of the `extra_info` `type` field to a wish title. */
export const TITLE_BY_TYPE: Record<string, string> = {
  A: 'Saya harap MAGGI menganjurkan',
  B: 'Saya harap MAGGI menghasilkan perisa',
  C: 'Saya harap MAGGI menghasilkan',
}

/** Title used when the type is missing, unparseable, or unrecognised. */
export const DEFAULT_API_TITLE = TITLE_BY_TYPE.A

interface ApiWish {
  id: number | string
  name?: string | null
  wishes?: string | null
  extra_info?: string | null
}

interface WallComment {
  id: number | string
  text?: string
  name?: string
  extra_info?: string | null
}

interface WallEvent {
  type: string
  comment?: WallComment
  commentId?: number | string
}

/**
 * The `extra_info` field is a JSON string like `{"type":"B"}` (or already an
 * object). Extract the `type` and resolve it to a wish title, falling back to
 * the first campaign title when it is missing, unparseable, or unrecognised.
 */
export function titleFromExtraInfo(extraInfo: unknown): string {
  let parsed: unknown = extraInfo
  if (typeof extraInfo === 'string' && extraInfo.trim() !== '') {
    try {
      parsed = JSON.parse(extraInfo)
    } catch {
      parsed = undefined
    }
  }
  if (parsed !== null && typeof parsed === 'object') {
    const type = (parsed as Record<string, unknown>).type
    if (typeof type === 'string') {
      return TITLE_BY_TYPE[type] ?? DEFAULT_API_TITLE
    }
  }
  return DEFAULT_API_TITLE
}

/** Map a wish from the list/create API payload onto the contract `Wish`. */
export function apiWishToWish(item: ApiWish): Wish {
  return {
    id: String(item.id),
    name: item.name ?? '',
    message: item.wishes ?? '',
    title: titleFromExtraInfo(item.extra_info),
  }
}

/**
 * Websocket transport for the wishing-wall API.
 *
 * On subscribe it loads existing wishes (GET /api/wishing-wall) and emits them
 * oldest-first, then connects to the live socket and relays `comment:add` /
 * `comment:remove` into the transport contract. `comment:update` is ignored.
 * The socket auto-reconnects after a drop while subscribed.
 */
export class WebSocketWishService implements IWishService {
  private handlers: WishEventHandlers | null = null
  private socket: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private stopped = true
  private readonly apiKey: string
  private readonly projectCode: string
  private readonly baseUrl: string
  /** Ids already emitted, so a wish is never added twice (GET snapshot + socket replay). */
  private seenIds = new Set<string>()

  constructor(options: WebSocketWishServiceOptions) {
    this.apiKey = options.apiKey
    this.projectCode = options.projectCode ?? DEFAULT_PROJECT_CODE
    this.baseUrl = options.baseUrl ?? ''
  }

  subscribe(handlers: WishEventHandlers): Unsubscribe {
    this.handlers = handlers
    this.stopped = false
    void this.loadExisting()
    this.connectSocket()
    return () => {
      this.stopped = true
      this.handlers = null
      if (this.reconnectTimer !== null) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
      this.socket?.close()
      this.socket = null
    }
  }

  private get apiBase(): string {
    return `${this.baseUrl}/api/wishing-wall`
  }

  private get wsBase(): string {
    if (this.baseUrl === '') {
      return '/ws/wall'
    }
    return `${this.baseUrl.replace(/^http/, 'ws')}/ws/wall`
  }

  private async loadExisting(): Promise<void> {
    const url = `${this.apiBase}?project_code=${encodeURIComponent(
      this.projectCode,
    )}&page=1&limit=50`
    try {
      const response = await fetch(url, {
        headers: { 'x-api-key': this.apiKey },
      })
      if (!response.ok) {
        return
      }
      const payload = (await response.json()) as { data?: ApiWish[] }
      if (!Array.isArray(payload.data)) {
        return
      }
      const handlers = this.handlers
      if (handlers === null) {
        return
      }
      // The API returns newest-first; emit oldest-first so the wall's
      // oldest-eviction keeps the newest wishes when the list exceeds capacity.
      const oldestFirst = [...payload.data].reverse()
      for (const item of oldestFirst) {
        const wish = apiWishToWish(item)
        if (this.seenIds.has(wish.id)) {
          continue
        }
        this.seenIds.add(wish.id)
        handlers.onWishAdded(wish)
      }
    } catch {
      // Live socket still runs; the existing-wish load is best-effort.
    }
  }

  private connectSocket(): void {
    if (this.stopped) {
      return
    }
    const url = `${this.wsBase}?project_code=${encodeURIComponent(
      this.projectCode,
    )}&api_key=${encodeURIComponent(this.apiKey)}`
    const socket = new WebSocket(url)
    this.socket = socket
    socket.onmessage = (event: MessageEvent) => {
      this.handleMessage(event)
    }
    socket.onclose = () => {
      if (this.stopped) {
        return
      }
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer !== null) {
      return
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connectSocket()
    }, RECONNECT_DELAY_MS)
  }

  private handleMessage(event: MessageEvent): void {
    let msg: WallEvent
    try {
      msg = JSON.parse(event.data as string) as WallEvent
    } catch {
      return
    }
    const handlers = this.handlers
    if (handlers === null) {
      return
    }
    switch (msg.type) {
      case 'comment:add':
        if (msg.comment) {
          const wish = this.commentToWish(msg.comment)
          if (this.seenIds.has(wish.id)) {
            break
          }
          this.seenIds.add(wish.id)
          handlers.onWishAdded(wish)
        }
        break
      case 'comment:remove':
        if (msg.commentId !== undefined && msg.commentId !== null) {
          this.seenIds.delete(String(msg.commentId))
          handlers.onWishRemoved(String(msg.commentId))
        }
        break
      case 'comment:update':
        // The transport contract has no update handler; updates are ignored.
        break
      default:
        break
    }
  }

  private commentToWish(comment: WallComment): Wish {
    return {
      id: String(comment.id),
      name: comment.name ?? '',
      message: comment.text ?? '',
      title: titleFromExtraInfo(comment.extra_info),
    }
  }
}
