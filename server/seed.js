/**
 * Засев демо-данных и разбор флага, который им управляет.
 *
 * Вынесено из `index.js` отдельным модулем не ради красоты: `index.js` — точка входа,
 * её импорт поднимает сервер, поэтому покрыть тестами живущую там логику нельзя.
 */

/**
 * Демо-данные при пустом хранилище. Нужны не для красоты: проверка проекта открывает
 * публичную страницу и идёт по пути записи, а в пустом календаре типов встреч нет —
 * и дойти до выбора слота физически не до чего.
 */
export const DEMO_EVENT_TYPES = [
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

const ENABLED_VALUES = ['true', '1', 'yes', 'on']
const DISABLED_VALUES = ['false', '0', 'no', 'off']

/**
 * Флаг выключающий: без переменной засев работает. Так и должно быть — он нужен локальной
 * разработке и контейнеру, который поднимает проверка Hexlet, а `render.yaml` туда не
 * попадает. Продакшен на Render гасит засев явно.
 *
 * Нераспознанное значение — ошибка, а не «считаем включённым». Опечатка вида `fasle`
 * в переменной продакшена молча вернула бы демо-данные на боевой деплой, и заметить это
 * было бы некому: приложение работает, тесты зелёные, просто в списке чужие записи.
 * Пусть лучше деплой не поднимется и скажет почему.
 */
export const isSeedEnabled = (env = process.env) => {
  const raw = env.SEED_DEMO
  if (raw === undefined || raw === '') return true

  const value = String(raw).trim().toLowerCase()
  if (ENABLED_VALUES.includes(value)) return true
  if (DISABLED_VALUES.includes(value)) return false

  throw new Error(
    `SEED_DEMO: нераспознанное значение ${JSON.stringify(raw)}. ` +
      `Допустимы ${ENABLED_VALUES.join(', ')} (включить) и ${DISABLED_VALUES.join(', ')} (выключить)`,
  )
}

/**
 * Засевает демо-типы встреч, если хранилище пустое. Возвращает число созданных записей,
 * чтобы вызывающий сам решил, что писать в лог, — модуль в консоль не пишет.
 */
export const seedIfEmpty = async (repositories) => {
  if ((await repositories.eventTypes.count()) > 0) return 0

  for (const eventType of DEMO_EVENT_TYPES) {
    await repositories.eventTypes.create(eventType)
  }
  return DEMO_EVENT_TYPES.length
}
