import antfu from '@antfu/eslint-config'

export default antfu({
  // it doesn't autodetect typescript
  typescript: true,
  ignores: [
    '**/db/schema.ts',
    '**/worker-configuration.d.ts',
    '**/.wrangler',
  ],
})
