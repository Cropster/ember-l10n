module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  extends: 'eslint:recommended',
  env: {
    es6: true,
    node: true,
    browser: true
  },
  rules: {
    'no-console': 0
  }
};
