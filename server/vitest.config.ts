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
  },
})
