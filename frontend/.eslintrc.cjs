// This is a workaround for https://github.com/eslint/eslint/issues/3458
require('@aprets/config/patch/modern-name-resolution');

module.exports = {
  extends: ['./node_modules/@aprets/config/eslint/react'],
  parserOptions: {
    project: `${__dirname}/tsconfig.json`,
  },
  ignorePatterns: ['.eslintrc.cjs', 'tsconfig.json', 'tailwind.config.js', 'postcss.config.js'],
};
