import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  typescript: true,
  rules: { 'ts/no-redeclare': 'off' },
})
