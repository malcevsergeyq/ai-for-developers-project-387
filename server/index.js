import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createApp } from './app.js'
import { createPool } from './db.js'
import { createMemoryRepositories } from './repositories/memory.js'
import { createPostgresRepositories } from './repositories/postgres.js'
import { isSeedEnabled, seedIfEmpty } from './seed.js'

/**
 * Хранилище выбирается по наличию `DATABASE_URL`. Это не «резервный вариант на всякий
 * случай», а требование среды: проверка проекта собирает только Dockerfile и запускает
 * контейнер, базы там нет. С переменной — Postgres, без неё — память.
 */
const repositories = process.env.DATABASE_URL
  ? createPostgresRepositories(createPool())
  : createMemoryRepositories()

console.log(
  process.env.DATABASE_URL
    ? 'Хранилище: PostgreSQL (DATABASE_URL задан)'
    : 'Хранилище: в памяти — DATABASE_URL не задан, данные исчезнут при перезапуске',
)

/**
 * Решение о засеве логируется в обоих случаях: иначе «откуда взялись эти записи» и
 * «почему список пустой» одинаково не читаются из логов старта.
 */
if (isSeedEnabled()) {
  const created = await seedIfEmpty(repositories)
  console.log(
    created > 0
      ? `Демо-данные включены: создано типов встреч — ${created}`
      : 'Демо-данные включены: хранилище не пустое, засев не потребовался',
  )
} else {
  console.log('Демо-данные отключены: SEED_DEMO выключен')
}

/**
 * Собранный фронт лежит рядом только в образе — в дев-режиме его нет, и тогда
 * сервер остаётся чистым API, а фронт живёт на своём dev-сервере.
 */
const distDir = fileURLToPath(new URL('../ui/dist', import.meta.url))
const staticDir = existsSync(distDir) ? distDir : null

console.log(staticDir ? `Отдаём собранный фронт из ${staticDir}` : 'Фронт не собран — только API')

const app = createApp({ repositories, staticDir })
const port = process.env.PORT ?? 3000

app.listen(port, () => {
  console.log(`Сервер слушает http://localhost:${port}`)
})
