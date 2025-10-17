module.exports = {
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};