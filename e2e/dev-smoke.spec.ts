import { expect, test } from '@playwright/test'

import { DEV_API_URL } from './config'

/**
 * Единственный тест, который проверяет не приложение, а **инструкцию по запуску**.
 * Остальные e2e идут против собранного фронта, которому адрес API передаёт сам
 * Playwright (`playwright.config.ts`), — то есть связку из README они не проверяют
 * вообще, и сломать её можно, не покрасив ни один прогон.
 *
 * Проверяем ровно то, за что цепляется человек, впервые запускающий проект по README:
 * `/event-types` должен уйти на бэкенд, а не остаться у Vite. Vite на неизвестный путь
 * отдаёт `index.html` со статусом 200, поэтому обычная проверка «ответ успешен»
 * здесь бесполезна — смотрим origin и content-type.
 */
test('дев-связка из README: фронт на 5173 берёт данные у API на 3000', async ({ page }) => {
  const eventTypes = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/event-types',
  )

  await page.goto('/')
  const response = await eventTypes

  expect(new URL(response.url()).origin, 'запрос обязан уйти на бэкенд').toBe(DEV_API_URL)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('application/json')

  // И то же самое глазами пользователя: список отрисован, панели с ошибкой нет.
  await expect(page.getByRole('heading', { name: 'Виды встреч' })).toBeVisible()
  await expect(page.getByRole('listitem').first()).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})
