import { describe, expect, it } from 'vitest'
import { AppServerProcess } from './codexAppServerBridge'

describe('AppServerProcess protocol state', () => {
  it.each([
    { threadId: 'thread-1', requestId: 42 },
    { threadId: 'thread-1', id: 42 },
  ])('removes pending requests when app-server resolves them with $requestId$id', (params) => {
    const appServer = new AppServerProcess() as unknown as {
      pendingServerRequests: Map<number, unknown>
      handleLine: (line: string) => void
    }
    appServer.pendingServerRequests.set(42, {
      id: 42,
      method: 'item/tool/requestUserInput',
      params: { threadId: 'thread-1' },
    })

    appServer.handleLine(JSON.stringify({
      method: 'serverRequest/resolved',
      params,
    }))

    expect(appServer.pendingServerRequests.has(42)).toBe(false)
  })
})
