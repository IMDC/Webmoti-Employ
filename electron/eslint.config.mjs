import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['models'],
  rules: {
    'node/prefer-global/process': 'off',
  },
})
