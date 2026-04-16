import unicorn from 'eslint-plugin-unicorn';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  {
    plugins: {
      unicorn,
    },
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'warn',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // 👇 File naming rule
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase', // or camelCase / snake_case
        },
      ],
    },
  },
];
