import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createApp } from './app.js'
import { createPool } from './db.js'
import { createMemoryRepositories } from './repositories/memory.js'
import { createPostgresRepositories } from './repositories/postgres.js'

/**
 * Демо-данные при пустом хранилище. Нужны не для красоты: проверка проекта открывает
 * публичную страницу и идёт по пути записи, а в пустом календаре типов встреч нет —
 * и дойти до выбора слота физически не до чего.
 *
 * Засев включён по умолчанию: так работают локальный `npm start` без `DATABASE_URL`
 * и контейнер, который поднимает проверка Hexlet (на него `render.yaml` не применяется).
 * Продакшен-деплой на Render подавляет засев переменной `SEED_DEMO=false`
 * (см. `render.yaml`) — иначе после чистого развёртывания в списке появлялись бы
 * «чужие» записи.
 */
const DEMO_EVENT_TYPES = [
  {
    title: 'Демо-звонок',
    description: 'Короткий разговор: покажу продукт и отвечу на вопросы.',
    durationMinutes: 30,
  },
  {
    title: 'Консультация',
    description: 'Разбираем вашу задачу подробно, с примерами и планом действий.',
    durationMinutes: 60,
  },
]

const seedIfEmpty = async (repositories) => {
  if ((await repositories.eventTypes.count()) > 0) return
  for (const eventType of DEMO_EVENT_TYPES) {
    await repositories.eventTypes.create(eventType)
  }
  console.log(`Создано демо-типов встреч: ${DEMO_EVENT_TYPES.length}`)
}

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

if (process.env.SEED_DEMO === 'false') {
  console.log('Демо-данные отключены: SEED_DEMO=false')
} else {
  await seedIfEmpty(repositories)
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
