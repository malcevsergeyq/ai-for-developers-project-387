import { afterEach, describe, expect, it, vi } from 'vitest'

import { createShutdown } from '../shutdown.js'

/**
 * Заглушка HTTP-сервера: `close` запоминает колбэк, чтобы тест сам решал, когда
 * соединения «закрылись». Настоящий сервер поднимать не нужно — проверяется порядок
 * действий и поведение на таймауте, а не сетевой стек.
 */
const fakeServer = () => {
  const state = { closeCalls: 0, finish: null, idleClosed: 0, allClosed: 0 }
  return {
    state,
    close(callback) {
      state.closeCalls += 1
      state.finish = callback
    },
    closeIdleConnections() {
      state.idleClosed += 1
    },
    closeAllConnections() {
      state.allClosed += 1
    },
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('createShutdown', () => {
  it('закрывает сервер, затем пул, и выходит нулевым кодом', async () => {
    const server = fakeServer()
    const exit = vi.fn()
    const order = []
    const pool = { end: vi.fn(async () => order.push('pool')) }

    const shutdown = createShutdown({ server, pool, exit, log: () => {} })
    const done = shutdown('SIGTERM')

    expect(server.state.closeCalls).toBe(1)
    // Простаивающие keep-alive соединения закрываются сразу: без этого `close`
    // ждал бы, пока браузер сам разорвёт связь, и укладывался бы в таймаут вхолостую.
    expect(server.state.idleClosed).toBe(1)

    order.push('server')
    server.state.finish()
    await done

    expect(order).toEqual(['server', 'pool'])
    expect(exit).toHaveBeenCalledWith(0)
  })

  it('без пула тоже завершается нулевым кодом', async () => {
    const server = fakeServer()
    const exit = vi.fn()

    const done = createShutdown({ server, pool: null, exit, log: () => {} })('SIGINT')
    server.state.finish()
    await done

    expect(exit).toHaveBeenCalledWith(0)
  })

  it('не ждёт вечно: по таймауту рвёт соединения и выходит кодом 1', async () => {
    vi.useFakeTimers()
    const server = fakeServer()
    const exit = vi.fn()

    createShutdown({ server, exit, timeoutMs: 5_000, log: () => {} })('SIGTERM')

    // Соединения не закрылись — колбэк `close` никто не вызвал.
    expect(exit).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(5_000)

    expect(server.state.allClosed).toBe(1)
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('повторный сигнал не запускает второе закрытие', async () => {
    const server = fakeServer()
    const exit = vi.fn()

    const shutdown = createShutdown({ server, exit, log: () => {} })
    const done = shutdown('SIGTERM')
    await shutdown('SIGTERM')

    expect(server.state.closeCalls).toBe(1)

    server.state.finish()
    await done
  })

  it('ошибку при закрытии показывает кодом 1, а не молчаливым нулём', async () => {
    const server = fakeServer()
    const exit = vi.fn()

    const done = createShutdown({ server, exit, log: () => {} })('SIGTERM')
    server.state.finish(new Error('порт не отпускается'))
    await done

    expect(exit).toHaveBeenCalledWith(1)
  })
})
