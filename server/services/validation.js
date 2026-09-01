import { validationFailed } from '../errors.js'

/**
 * Проверки тела запроса. Границы держатся здесь, а не в роутах: одно и то же правило
 * («название до 100 символов») описано в контракте один раз и в коде должно быть
 * тоже в одном месте — иначе схема, спека и обработчик разъедутся по очереди.
 */

/** Достаточно строгая проверка, чтобы отсечь опечатки, и достаточно мягкая, чтобы не спорить с RFC. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const requireObject = (body) => {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw validationFailed('Тело запроса должно быть JSON-объектом')
  }
  return body
}

export const requireText = (value, { field, min = 1, max }) => {
  if (typeof value !== 'string') throw validationFailed(`Поле «${field}» должно быть строкой`)
  const trimmed = value.trim()
  if (trimmed.length < min) throw validationFailed(`Поле «${field}» не может быть пустым`)
  if (trimmed.length > max) throw validationFailed(`Поле «${field}» длиннее ${max} символов`)
  return trimmed
}

export const optionalText = (value, { field, max }) => {
  if (value === undefined || value === null) return null
  const text = requireText(value, { field, min: 0, max })
  return text === '' ? null : text
}

export const requireEmail = (value, { field }) => {
  const email = requireText(value, { field, max: 320 })
  if (!EMAIL_PATTERN.test(email)) throw validationFailed(`Поле «${field}» не похоже на email`)
  return email
}

export const requireDuration = (value, { field, step, min, max }) => {
  if (!Number.isInteger(value)) throw validationFailed(`Поле «${field}» должно быть целым числом`)
  if (value < min || value > max) {
    throw validationFailed(`Поле «${field}» должно быть от ${min} до ${max} минут`)
  }
  if (value % step !== 0) {
    throw validationFailed(`Поле «${field}» должно быть кратно ${step} минутам`)
  }
  return value
}

/**
 * Момент времени по RFC 3339 — с обязательной зоной: либо `Z`, либо числовое смещение.
 * Смещение допускаем: оно задаёт момент однозначно, и `new Date` приведёт его к UTC.
 */
const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/

export const requireInstant = (value, { field }) => {
  if (typeof value !== 'string') throw validationFailed(`Поле «${field}» должно быть строкой ISO 8601`)

  /**
   * Зона проверяется до `new Date`, и это принципиально: строку без зоны движок молча
   * трактует как локальное время машины, а дальше по коду ходит уже готовый `Date`,
   * по которому не восстановить, что именно прислал клиент. Контракт обещает
   * `utcDateTime` — момент времени, а не «09:30 где-то».
   */
  if (!INSTANT_PATTERN.test(value)) {
    throw validationFailed(
      `Поле «${field}» должно быть моментом времени ISO 8601 с часовым поясом: «2026-08-20T09:00:00Z» или «2026-08-20T12:00:00+03:00»`,
    )
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw validationFailed(`Поле «${field}» не является датой ISO 8601`)
  return date
}
