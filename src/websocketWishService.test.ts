import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiWishToWish,
  DEFAULT_API_TITLE,
  RECONNECT_DELAY_MS,
  TITLE_BY_TYPE,
  titleFromExtraInfo,
  WebSocketWishService,
} from './websocketWishService'
import type { Wish, WishEventHandlers } from './transport'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  url: string
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: (() => void) | null = null
  closed = false

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }

  close() {
    this.closed = true
  }

  emitMessage(data: unknown) {
    this.onmessage?.({ data } as MessageEvent)
  }

  emitClose() {
    this.onclose?.()
  }
}

function capture() {
  const added: Wish[] = []
  const removed: string[] = []
  const handlers: WishEventHandlers = {
    onWishAdded: (wish) => added.push(wish),
    onWishRemoved: (id) => removed.push(id),
  }
  return { handlers, added, removed }
}

const emptyListResponse = () => ({ ok: true, json: async () => ({ data: [] }) })

beforeEach(() => {
  FakeWebSocket.instances = []
  vi.stubGlobal('WebSocket', FakeWebSocket)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('titleFromExtraInfo', () => {
  it('maps type A/B/C to the campaign titles', () => {
    expect(titleFromExtraInfo('{"type":"A"}')).toBe(TITLE_BY_TYPE.A)
    expect(titleFromExtraInfo('{"type":"B"}')).toBe(TITLE_BY_TYPE.B)
    expect(titleFromExtraInfo('{"type":"C"}')).toBe(TITLE_BY_TYPE.C)
  })

  it('accepts an already-parsed object', () => {
    expect(titleFromExtraInfo({ type: 'B' })).toBe(TITLE_BY_TYPE.B)
  })

  it('falls back to the first title for missing, blank, malformed, or unknown input', () => {
    expect(titleFromExtraInfo(null)).toBe(DEFAULT_API_TITLE)
    expect(titleFromExtraInfo(undefined)).toBe(DEFAULT_API_TITLE)
    expect(titleFromExtraInfo('')).toBe(DEFAULT_API_TITLE)
    expect(titleFromExtraInfo('not json')).toBe(DEFAULT_API_TITLE)
    expect(titleFromExtraInfo('{"type":"Z"}')).toBe(DEFAULT_API_TITLE)
    expect(titleFromExtraInfo({})).toBe(DEFAULT_API_TITLE)
  })
})

describe('apiWishToWish', () => {
  it('maps the API fields onto the contract Wish', () => {
    const wish = apiWishToWish({
      id: 44,
      name: 'test',
      wishes: 'maggi',
      extra_info: '{"type":"B"}',
    })
    expect(wish).toEqual({
      id: '44',
      name: 'test',
      message: 'maggi',
      title: TITLE_BY_TYPE.B,
    })
  })

  it('defaults missing optional fields', () => {
    expect(apiWishToWish({ id: 1 })).toEqual({
      id: '1',
      name: '',
      message: '',
      title: DEFAULT_API_TITLE,
    })
  })
})

describe('WebSocketWishService', () => {
  it('loads existing wishes oldest-first and connects the socket', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 44,
            name: 'test',
            wishes: 'maggi',
            extra_info: '{"type":"B"}',
          },
          {
            id: 43,
            name: 'assrasrsara',
            wishes: 'tete',
            extra_info: '{"type":"A"}',
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const service = new WebSocketWishService({ apiKey: 'k' })
    const { handlers, added, removed } = capture()
    service.subscribe(handlers)

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/wishing-wall?project_code=maggi20260910'),
      expect.objectContaining({ headers: { 'x-api-key': 'k' } }),
    )
    expect(added.map((wish) => wish.id)).toEqual(['43', '44'])
    expect(added[0]).toMatchObject({
      name: 'assrasrsara',
      message: 'tete',
      title: TITLE_BY_TYPE.A,
    })
    expect(added[1]).toMatchObject({
      name: 'test',
      message: 'maggi',
      title: TITLE_BY_TYPE.B,
    })
    expect(removed).toHaveLength(0)

    expect(FakeWebSocket.instances).toHaveLength(1)
    expect(FakeWebSocket.instances[0].url).toContain('project_code=maggi20260910')
    expect(FakeWebSocket.instances[0].url).toContain('api_key=k')
  })

  it('relays comment:add, ignores comment:update, and relays comment:remove', async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyListResponse())
    vi.stubGlobal('fetch', fetchMock)

    const service = new WebSocketWishService({ apiKey: 'k' })
    const { handlers, added, removed } = capture()
    service.subscribe(handlers)

    const socket = FakeWebSocket.instances[0]
    socket.emitMessage(
      JSON.stringify({
        type: 'comment:add',
        comment: {
          id: 7,
          text: 'hello',
          name: 'Alice',
          extra_info: '{"type":"A"}',
        },
      }),
    )
    socket.emitMessage(
      JSON.stringify({
        type: 'comment:update',
        comment: { id: 7, text: 'changed', name: 'Alice' },
      }),
    )
    socket.emitMessage(JSON.stringify({ type: 'comment:remove', commentId: 7 }))

    expect(added).toHaveLength(1)
    expect(added[0]).toEqual({
      id: '7',
      name: 'Alice',
      message: 'hello',
      title: TITLE_BY_TYPE.A,
    })
    expect(removed).toEqual(['7'])
  })

  it('ignores a comment:remove without a commentId', async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyListResponse())
    vi.stubGlobal('fetch', fetchMock)

    const service = new WebSocketWishService({ apiKey: 'k' })
    const { handlers, removed } = capture()
    service.subscribe(handlers)

    FakeWebSocket.instances[0].emitMessage(
      JSON.stringify({ type: 'comment:remove' }),
    )
    expect(removed).toHaveLength(0)
  })

  it('reconnects after the socket drops and stops after unsubscribe', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(emptyListResponse())
    vi.stubGlobal('fetch', fetchMock)

    const service = new WebSocketWishService({ apiKey: 'k' })
    const { handlers } = capture()
    const unsubscribe = service.subscribe(handlers)

    expect(FakeWebSocket.instances).toHaveLength(1)
    FakeWebSocket.instances[0].emitClose()

    vi.advanceTimersByTime(RECONNECT_DELAY_MS)
    expect(FakeWebSocket.instances).toHaveLength(2)

    unsubscribe()
    FakeWebSocket.instances[1].emitClose()
    vi.advanceTimersByTime(RECONNECT_DELAY_MS * 2)
    expect(FakeWebSocket.instances).toHaveLength(2)
  })
})
