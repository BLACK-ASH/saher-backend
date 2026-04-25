import unicorn from 'eslint-plugin-unicorn';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import noResJson from './dist/libs/eslint-rules/no-res-json.js';

export default defineConfig([
  {
    files: ['**/*.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  globalIgnores(['out/**', 'build/**', 'dist/**', 'docs/*', 'public/*']),
  {
    ignores: ['**/api-response.ts', '**/error-handler.ts', '**/middleware/**'],

    plugins: {
      unicorn,
      custom: {
        rules: {
          'no-res-json': noResJson,
        },
      },
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

      'custom/no-res-json': 'warn',

      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
        },
      ],
    },
  },
]);
