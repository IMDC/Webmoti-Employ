import antfu from '@antfu/eslint-config'

export default antfu({
  // it doesn't autodetect typescript
  typescript: true,
  markdown: true,
  pnpm: true,
  rules: {
    'pnpm/json-enforce-catalog': 'off',
  },
  ignores: [
    '**/db/schema.ts',
    '**/worker-configuration.d.ts',
    '**/.wrangler',
  ],
})
