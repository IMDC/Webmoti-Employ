import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    '**/db/schema.ts',
    '**/worker-configuration.d.ts',
    '**/.wrangler',
  ],
})
