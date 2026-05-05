import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ✅ your custom rule
import noResJson from './dist/libs/eslint-rules/no-res-json.js';

export default defineConfig([
  // Apply only to TS files
  {
    files: ['**/*.ts'],
  },

  // Base configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  // Ignore build/output
  globalIgnores(['node_modules/**', 'dist/**', 'build/**', 'out/**', 'docs/**']),

  {
    // Files where custom rule should NOT apply
    ignores: ['**/api-response.ts', '**/error-handler.ts', '**/middleware/**'],

    plugins: {
      unicorn,
      import: importPlugin,

      // ✅ Custom plugin
      custom: {
        rules: {
          'no-res-json': noResJson,
        },
      },
    },

    languageOptions: {
      globals: globals.node,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    rules: {
      /* ----------------- GENERAL ----------------- */
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-else-return': 'warn',

      /* ----------------- TYPESCRIPT ----------------- */
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',

      /* ----------------- NAMING ----------------- */
      '@typescript-eslint/naming-convention': [
        'error',

        // ✅ TYPES (classes, interfaces, etc.)
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },

        // ✅ VARIABLES (default)
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },

        // ✅ CONST variables (allow PascalCase too)
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },

        // ✅ ENUMS
        {
          selector: 'enumMember',
          format: ['PascalCase', 'UPPER_CASE'],
        },

        // ✅ IGNORE object properties (DB/API)
        {
          selector: 'property',
          format: null,
        },
      ],
      /* ----------------- IMPORTS ----------------- */
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      'import/no-duplicates': 'error',

      /* ----------------- UNICORN ----------------- */
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',

      /* ----------------- CUSTOM RULE ----------------- */
      'custom/no-res-json': 'error',
    },
  },
]);
