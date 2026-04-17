module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'docs', 'style', 'test', 'chore', 'perf', 'ci', 'build'],
    ],

    'scope-empty': [2, 'never'],

    'subject-max-length': [2, 'always', 72],

    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case']],
  },
};
