import { expect, type APIRequestContext, type Page } from '@playwright/test'

import { API_URL } from './config'

export type Slot = { start: string; end: string }

/**
 * Идентификатор прогона. Раньше уникальность держалась на счётчике в памяти процесса,
 * а он обнуляется при каждом старте Playwright: против уже запущенного приложения
 * (контейнер, деплой) второй прогон заводил «Демо-звонок №1» повторно, и локаторы
 * находили две карточки вместо одной. Внутри прогона тесты по-прежнему разведены
 * счётчиком — хранилище одно на всех.
 */
const RUN_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

let counter = 0

export const uniqueTitle = (prefix: string) => `${prefix} ${RUN_ID}-${(counter += 1)}`

/** Почта гостя тоже уникальна на прогон: по ней тесты ищут свою бронь в списке владельца. */
export const uniqueEmail = (prefix: string) => `${prefix}-${RUN_ID}@example.com`

export const createEventType = async (
  request: APIRequestContext,
  { title, description = 'Создан e2e-тестом', durationMinutes = 30 },
) => {
  const response = await request.post(`${API_URL}/admin/event-types`, {
    data: { title, description, durationMinutes },
  })
  expect(response.status(), 'тип встречи должен создаваться').toBe(201)
  return (await response.json()) as { id: string; title: string; durationMinutes: number }
}

export const fetchSlots = async (request: APIRequestContext, eventTypeId: string) => {
  const response = await request.get(`${API_URL}/event-types/${eventTypeId}/slots`)
  expect(response.status()).toBe(200)
  return (await response.json()) as Slot[]
}

/**
 * Занять слот в обход браузера — так имитируется гость, опередивший нас на полсекунды.
 */
export const bookViaApi = async (
  request: APIRequestContext,
  { eventTypeId, start }: { eventTypeId: string; start: string },
) => {
  const response = await request.post(`${API_URL}/bookings`, {
    data: {
      eventTypeId,
      start,
      guestName: 'Кто-то быстрее',
      guestEmail: uniqueEmail('faster'),
    },
  })
  expect(response.status(), 'слот должен успешно заниматься').toBe(201)
}

const SLOT_MINUTES = 30

const minutesBetween = (from: string, to: string) =>
  (new Date(to).getTime() - new Date(from).getTime()) / 60_000

/**
 * Цепочка из `count` подряд идущих свободных слотов внутри одного дня.
 *
 * Раньше тесты требовали конкретное время конкретного дня (`DAY = 5`, `TIME = '12:00'`).
 * Против свежего приложения это работало, против уже запущенного — нет: первый же прогон
 * занимал 12:00, и второй падал ещё до браузера. Свободное время берём из ответа API,
 * а не вычисляем заново: дублировать правила окна записи в тесте значило бы проверять
 * их самими собой.
 */
export const findFreeRun = (slots: Slot[], count: number) => {
  const byDay = new Map<string, Slot[]>()
  for (const slot of slots) {
    const day = slot.start.slice(0, 10)
    byDay.set(day, [...(byDay.get(day) ?? []), slot])
  }

  for (const daySlots of byDay.values()) {
    for (let start = 0; start + count <= daySlots.length; start += 1) {
      const chunk = daySlots.slice(start, start + count)
      const consecutive = chunk.every(
        (slot, index) =>
          index === 0 || minutesBetween(chunk[index - 1].start, slot.start) === SLOT_MINUTES,
      )
      if (consecutive) return chunk
    }
  }

  throw new Error(
    `В окне записи не осталось ${count} свободных слотов подряд в один день — ` +
      'приложение забронировано целиком, данные пора сбросить',
  )
}

/** Подпись кнопки времени: интерфейс показывает UTC, поэтому берём часы прямо из ISO. */
export const timeOf = (slot: Slot) => slot.start.slice(11, 16)

const dayLabel = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

/**
 * Кнопка дня ищется по дате, а не по порядковому номеру: у типов встреч разной длительности
 * набор доступных дней разный, и один и тот же индекс означал бы разные дни. Регулярка
 * с границей нужна, чтобы «1 августа» не совпало внутри «21 августа».
 */
export const dayButtonFor = (page: Page, slot: Slot) => {
  const label = dayLabel.format(new Date(slot.start))
  return page.getByRole('button', { name: new RegExp(`(^|\\s)${label}$`) })
}

export const slotButton = (page: Page, time: string) =>
  page.getByRole('button', { name: time, exact: true })

export const openBookingPage = async (page: Page, eventTypeTitle: string) => {
  await page.goto('/')
  await page
    .getByRole('listitem')
    .filter({ hasText: eventTypeTitle })
    .getByRole('link', { name: 'Выбрать время' })
    .click()
}

export const fillGuestForm = async (
  page: Page,
  { name = 'Сергей Мальцев', email = 'guest@example.com', notes = '' } = {},
) => {
  await page.getByLabel('Имя').fill(name)
  await page.getByLabel('Email').fill(email)
  if (notes) await page.getByLabel(/Комментарий/).fill(notes)
}
