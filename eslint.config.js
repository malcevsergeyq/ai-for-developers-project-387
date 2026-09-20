import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['.opencode/**', 'ui/dist/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Аргумент с префиксом _ — осознанно неиспользуемый: обработчик ошибок Express
      // обязан принимать (err, req, res, next), иначе Express не распознаёт его как error middleware.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: 'error',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },
  {
    // Точка входа печатает сообщение о старте, а модуль остановки — о ходе завершения.
    // Это их работа, а не забытая отладка: в контейнере логи — единственный способ
    // увидеть, дошёл ли сигнал и уложился ли процесс в таймаут.
    files: ['server/index.js', 'server/shutdown.js'],
    rules: { 'no-console': 'off' },
  },
];
