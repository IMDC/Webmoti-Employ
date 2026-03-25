import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  typescript: true,
  markdown: true,
  pnpm: true,
  formatters: {
    css: true,
    html: true,
  },
  ignores: [
    '**/routeTree.gen.ts',
  ],
  rules: {
    'react-hooks-extra/no-direct-set-state-in-use-effect': 'off',
    'pnpm/json-enforce-catalog': 'off',
  },
}, {
  // it's ok because tanstack router handles hmr
  files: ['src/routes/**'],
  rules: {
    'react-refresh/only-export-components': 'off',
  },
})
