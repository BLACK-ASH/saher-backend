import unicorn from 'eslint-plugin-unicorn';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import { globalIgnores } from 'eslint/config';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  globalIgnores([
    // Default ignores of eslint-config-next:
    'out/**',
    'build/**',
    'dist/**',
    'docs/*',
    'public/*',
  ]),
  {
    plugins: {
      unicorn,
    },
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],

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
