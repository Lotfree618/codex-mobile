import { describe, expect, it } from 'vitest'
import { AppServerProcess } from './codexAppServerBridge'

describe('AppServerProcess protocol state', () => {
  it.each([
    { threadId: 'thread-1', requestId: 42 },
    { threadId: 'thread-1', requestId: 'request-42' },
  ])('removes pending requests when app-server resolves them with $requestId', (params) => {
    const appServer = new AppServerProcess() as unknown as {
      pendingServerRequests: Map<string | number, unknown>
      handleLine: (line: string) => void
    }
    appServer.pendingServerRequests.set(params.requestId, {
      id: params.requestId,
      method: 'item/tool/requestUserInput',
      params: { threadId: 'thread-1' },
    })

    appServer.handleLine(JSON.stringify({
      method: 'serverRequest/resolved',
      params,
    }))

    expect(appServer.pendingServerRequests.has(params.requestId)).toBe(false)
  })

  it.each(['completed', 'interrupted'])('removes thread requests when a turn is %s', (status) => {
    const appServer = new AppServerProcess() as unknown as {
      pendingServerRequests: Map<string | number, unknown>
      handleLine: (line: string) => void
    }
    appServer.pendingServerRequests.set('thread-1-request', {
      id: 'thread-1-request',
      method: 'item/tool/requestUserInput',
      params: { threadId: 'thread-1', turnId: 'turn-1' },
    })
    appServer.pendingServerRequests.set('thread-2-request', {
      id: 'thread-2-request',
      method: 'item/tool/requestUserInput',
      params: { threadId: 'thread-2', turnId: 'turn-2' },
    })

    appServer.handleLine(JSON.stringify({
      method: 'turn/completed',
      params: {
        threadId: 'thread-1',
        turn: { id: 'turn-1', status },
      },
    }))

    expect(appServer.pendingServerRequests.has('thread-1-request')).toBe(false)
    expect(appServer.pendingServerRequests.has('thread-2-request')).toBe(true)
  })

  it('does not confuse a numeric server request with a pending client response', () => {
    const appServer = new AppServerProcess() as unknown as {
      pending: Map<number, unknown>
      pendingServerRequests: Map<string | number, unknown>
      handleLine: (line: string) => void
    }
    appServer.pending.set(7, { resolve: () => undefined, reject: () => undefined })

    appServer.handleLine(JSON.stringify({
      id: 7,
      method: 'item/tool/requestUserInput',
      params: { threadId: 'thread-1', questions: [] },
    }))

    expect(appServer.pending.has(7)).toBe(true)
    expect(appServer.pendingServerRequests.has(7)).toBe(true)
  })
})
