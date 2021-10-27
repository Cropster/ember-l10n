'use strict';

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  plugins: ['ember', 'ember-suave'],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended',
    'plugin:ember-suave/recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    browser: true,
  },
  rules: {
    'ember-suave/lines-between-object-properties': 0,
    'ember-suave/lines-between-class-members': 0,
    'ember-suave/require-access-in-comments': 0,
  },
  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js',
        '.template-lintrc.js',
        'ember-cli-build.js',
        'index.js',
        'testem.js',
        'config/**/*.js',
        'tests/dummy/config/**/*.js',
        'lib/**/*.js',
      ],
      excludedFiles: ['app/**', 'addon/**', 'tests/dummy/app/**'],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        browser: false,
        node: true,
      },
      plugins: ['node'],
      extends: ['plugin:node/recommended'],
    },

    // node tests
    {
      files: ['node-tests/**/*-test.js'],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2017,
      },
      env: {
        browser: false,
        node: true,
        mocha: true,
      },
      plugins: ['node'],
      extends: ['plugin:node/recommended'],
      rules: {
        'node/no-unsupported-features/es-syntax': [
          'error',
          {
            version: '>=8.5.0',
            ignores: [],
          },
        ],
        'node/no-unsupported-features/node-builtins': [
          'error',
          {
            version: '>=8.5.0',
            ignores: [],
          },
        ],
      },
    },

    // test files
    {
      files: ['tests/**/*.js'],
      excludedFiles: ['tests/dummy/**/*.js'],
      rules: {
        'ember/avoid-leaking-state-in-ember-objects': 'off',
      },
    },
  ],
};
