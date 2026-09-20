import { expect, test } from '@playwright/test'

import {
  createEventType,
  dayButtonFor,
  fetchSlots,
  fillGuestForm,
  findFreeRun,
  openBookingPage,
  slotButton,
  timeOf,
  uniqueEmail,
  uniqueTitle,
} from './helpers'

test('гость проходит путь записи, и встреча появляется у владельца', async ({ page, request }) => {
  const guestEmail = uniqueEmail('guest-happy-path')

  const eventType = await createEventType(request, { title: uniqueTitle('Демо-звонок') })
  const [slot] = findFreeRun(await fetchSlots(request, eventType.id), 1)

  await openBookingPage(page, eventType.title)
  await dayButtonFor(page, slot).click()
  await slotButton(page, timeOf(slot)).click()
  await fillGuestForm(page, { email: guestEmail, notes: 'Записался через e2e' })
  await page.getByRole('button', { name: 'Записаться' }).click()

  await expect(page.getByText('Запись подтверждена')).toBeVisible()
  await expect(page.getByRole('heading', { name: eventType.title })).toBeVisible()

  // Второй сценарий того же пути: запись обязана сохраниться и быть видимой владельцу —
  // это единственная проверка, проходящая через оба контура приложения.
  await page.goto('/admin')
  const booking = page.getByRole('listitem').filter({ hasText: guestEmail })
  await expect(booking).toContainText(eventType.title)
  await expect(booking).toContainText('Записался через e2e')

  // И третий: то же время больше не предлагается другим гостям.
  await openBookingPage(page, eventType.title)
  await dayButtonFor(page, slot).click()
  await expect(slotButton(page, timeOf(slot))).toHaveCount(0)
})

test('часовая встреча закрывает время и для другого типа встречи', async ({ page, request }) => {
  // Правило контракта: занятость глобальная, а не в рамках одного типа встречи.
  // Юнит-тест сервиса переживёт правку «брать брони только своего типа», если заодно
  // поправят заглушку, — а этот тест нет.
  const consultation = await createEventType(request, {
    title: uniqueTitle('Консультация'),
    durationMinutes: 60,
  })
  const demo = await createEventType(request, { title: uniqueTitle('Демо'), durationMinutes: 30 })

  // Нужны четыре свободных получаса подряд: один до встречи, два под неё и один после.
  // Границы важны не меньше середины — на них проверяется, что стык не считается
  // пересечением.
  const [before, target, inside, after] = findFreeRun(await fetchSlots(request, demo.id), 4)

  await openBookingPage(page, consultation.title)
  await dayButtonFor(page, target).click()
  await slotButton(page, timeOf(target)).click()
  await fillGuestForm(page, { email: uniqueEmail('guest-overlap') })
  await page.getByRole('button', { name: 'Записаться' }).click()
  await expect(page.getByText('Запись подтверждена')).toBeVisible()

  await openBookingPage(page, demo.title)
  await dayButtonFor(page, target).click()

  // Часовая консультация заняла два получаса, поэтому демо нельзя ни в один из них.
  await expect(slotButton(page, timeOf(target))).toHaveCount(0)
  await expect(slotButton(page, timeOf(inside))).toHaveCount(0)
  // А соседние остаются: встреча заканчивается ровно там, где начинается следующий слот,
  // и стык пересечением не считается.
  await expect(slotButton(page, timeOf(before))).toBeVisible()
  await expect(slotButton(page, timeOf(after))).toBeVisible()
})
