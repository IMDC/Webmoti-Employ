import antfu from '@antfu/eslint-config'

export default antfu({
  pnpm: true,
  ignores: ['models'],
  rules: {
    'node/prefer-global/process': 'off',
    'pnpm/json-enforce-catalog': 'off',
  },
})
