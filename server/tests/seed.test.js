import { describe, expect, it } from 'vitest'

import { createMemoryRepositories } from '../repositories/memory.js'
import { DEMO_EVENT_TYPES, isSeedEnabled, seedIfEmpty } from '../seed.js'

/**
 * Флаг управляет тем, что видит пользователь на чистом деплое, а ошибка в нём не падает
 * и не ломает тесты — просто в продакшене появляются «чужие» записи. Поэтому поведение
 * зафиксировано тестами, а не одной ручной проверкой.
 */
describe('isSeedEnabled', () => {
  it('без переменной засев включён — это режим локальной разработки и проверки Hexlet', () => {
    expect(isSeedEnabled({})).toBe(true)
    expect(isSeedEnabled({ SEED_DEMO: '' })).toBe(true)
  })

  it('продакшен выключает засев', () => {
    expect(isSeedEnabled({ SEED_DEMO: 'false' })).toBe(false)
  })

  it.each(['true', '1', 'yes', 'on', 'TRUE', ' True '])('включает при %s', (value) => {
    expect(isSeedEnabled({ SEED_DEMO: value })).toBe(true)
  })

  it.each(['false', '0', 'no', 'off', 'FALSE', ' False '])('выключает при %s', (value) => {
    expect(isSeedEnabled({ SEED_DEMO: value })).toBe(false)
  })

  /**
   * Главный тест этого файла. Прежняя проверка `SEED_DEMO === 'false'` на опечатку
   * отвечала молча: засев включался, деплой поднимался, никто ничего не замечал.
   */
  it.each(['fasle', 'нет', '2', 'disabled'])('падает на нераспознанном значении %s', (value) => {
    expect(() => isSeedEnabled({ SEED_DEMO: value })).toThrowError(/SEED_DEMO/)
  })
})

describe('seedIfEmpty', () => {
  it('засевает демо-типы в пустое хранилище', async () => {
    const repositories = createMemoryRepositories()

    const created = await seedIfEmpty(repositories)

    expect(created).toBe(DEMO_EVENT_TYPES.length)
    const stored = await repositories.eventTypes.list()
    expect(stored.map((eventType) => eventType.title)).toEqual(
      DEMO_EVENT_TYPES.map((eventType) => eventType.title),
    )
  })

  it('не трогает непустое хранилище', async () => {
    const repositories = createMemoryRepositories()
    await repositories.eventTypes.create({
      title: 'Свой тип',
      description: 'Создан владельцем',
      durationMinutes: 45,
    })

    const created = await seedIfEmpty(repositories)

    expect(created).toBe(0)
    const stored = await repositories.eventTypes.list()
    expect(stored).toHaveLength(1)
  })
})
