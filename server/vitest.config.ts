import path from 'node:path'
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

// use mock string to get past local hyperdrive error
// eslint-disable-next-line node/prefer-global/process
process.env.WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE
 = 'postgresql://test:test@localhost:5432/test'

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@webmoti-employ/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
})
