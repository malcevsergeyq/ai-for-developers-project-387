/**
 * Управляемое завершение процесса.
 *
 * В контейнере `node` запускается как PID 1, а PID 1 в Linux игнорирует сигналы, у которых
 * нет собственного обработчика. Без этого модуля `docker stop` слал SIGTERM в пустоту,
 * ждал grace-период целиком и добивал процесс через SIGKILL — контейнер выходил с кодом
 * 137, оборвав недоделанные запросы.
 *
 * Логика живёт отдельным файлом от `index.js` намеренно: точка входа исполняется при
 * импорте, поэтому покрыть тестами то, что лежит в ней, нельзя.
 */

const DEFAULT_TIMEOUT_MS = 10_000

export const createShutdown = ({
  server,
  pool = null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  exit = (code) => process.exit(code),
  log = console.log,
}) => {
  let closing = false

  return async (signal) => {
    // Второй Ctrl+C или повторный сигнал от оркестратора не должен запускать
    // закрытие заново поверх уже идущего.
    if (closing) return
    closing = true

    log(`Получен ${signal} — закрываем сервер`)

    const timer = setTimeout(() => {
      log(`Соединения не закрылись за ${timeoutMs} мс — обрываем принудительно`)
      server.closeAllConnections?.()
      exit(1)
    }, timeoutMs)
    // Таймер не должен сам по себе удерживать процесс живым.
    timer.unref?.()

    try {
      const closed = new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()))
      })

      /**
       * Keep-alive соединения простаивают, но `close` их ждёт: без этой строки штатная
       * остановка упиралась бы в таймаут каждый раз, когда кто-то держал открытую вкладку.
       */
      server.closeIdleConnections?.()

      await closed
      await pool?.end()

      clearTimeout(timer)
      log('Сервер остановлен')
      exit(0)
    } catch (err) {
      clearTimeout(timer)
      log(`Не удалось закрыть сервер штатно: ${err.message}`)
      exit(1)
    }
  }
}

/** Вешает обработчик на оба сигнала: SIGTERM приходит от оркестратора, SIGINT — от Ctrl+C. */
export const installShutdown = (options) => {
  const shutdown = createShutdown(options)
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => {
      void shutdown(signal)
    })
  }
  return shutdown
}
