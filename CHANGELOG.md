# Changelog

## [1.0.1](https://github.com/malcevsergeyq/ai-for-developers-project-387/compare/v1.0.0...v1.0.1) (2026-09-20)


### Bug Fixes

* **deploy:** привести SEED_DEMO к тому, что происходит на проде ([#16](https://github.com/malcevsergeyq/ai-for-developers-project-387/issues/16)) ([611e2b2](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/611e2b2ed4fdbd15ee05bcbe1e5421285fa951f8))

## 1.0.0 (2026-09-20)

Первый релиз «Записи на звонок»: владелец публикует типы встреч, гость выбирает свободный слот и записывается без регистрации.

> История репозитория старше приложения: в ней остались коммиты раннего скоупа — расписания доступности, правило «один email — одна активная бронь на дату», кэш публичного списка типов встреч. В коде этих возможностей нет, они удалены при смене технического задания 19.08.2026, поэтому в changelog релиза не попали.

### Features

* **spec:** TypeSpec-контракт как источник истины, `openapi.yaml` генерируется из него ([a66a1df](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/a66a1dfbd23de6acdcdb52b3a96f3b4c7e5f30b7))
* **ui:** фронт по контракту — React + TypeScript + Vite + shadcn/ui ([97e7bef](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/97e7befa6260bc807ff9aff5e738b1c3f5e30b1e))
* **server:** бэкенд по контракту: семь операций, генерация слотов, глобальная занятость времени ([605df43](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/605df4378242b4d2ab1c5491334472e3e35242e5))
* **docker:** образ с фронтом и API в одном процессе ([00821a5](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/00821a58bceb9b995bf14c2d0d58a48d420fe41f))
* **server:** демо-засев за флагом `SEED_DEMO` ([#4](https://github.com/malcevsergeyq/ai-for-developers-project-387/issues/4)) ([d4d91b7](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/d4d91b750c9f420dc26e859998dec152f40f8217))

### Bug Fixes

* **server:** время без часового пояса больше не принимается как локальное ([2918830](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/29188300554c5d68e299cd7fc5c00061b0f48e28))
* **server:** управляемое завершение по SIGTERM — контейнер останавливается штатно, а не по SIGKILL ([2918830](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/29188300554c5d68e299cd7fc5c00061b0f48e28))
* **ui:** понятное сообщение, когда ответ пришёл не в формате JSON ([2918830](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/29188300554c5d68e299cd7fc5c00061b0f48e28))
* **ui:** meta description и `robots.txt` ([#8](https://github.com/malcevsergeyq/ai-for-developers-project-387/issues/8)) ([a66b4b4](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/a66b4b4bbfa76f535115725671738adad4ba0ea6))
* **ci:** агент больше не виснет на запросе разрешения ([dd99fd6](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/dd99fd61492f99c63160b420782859abccc81d95))
* **ci:** дать агенту право и токен для создания issue ([6c37f21](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/6c37f21aa925f36e0207ccf0d662d03e2f6f73d9))
* **ci:** ограничить Vitest серверными тестами ([1a83bd0](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/1a83bd03d93414530d87e308557128be1bd275ab))

### Performance Improvements

* **ui:** ленивая загрузка страниц владельца и брони ([#10](https://github.com/malcevsergeyq/ai-for-developers-project-387/issues/10)) ([f535709](https://github.com/malcevsergeyq/ai-for-developers-project-387/commit/f53570913b99021a2198123d3cbffa515b5ad5b4))
