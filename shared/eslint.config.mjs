import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  typescript: true,
  pnpm: true,
  rules: {
    'ts/no-redeclare': 'off',
    'pnpm/json-enforce-catalog': 'off',
  },
})
