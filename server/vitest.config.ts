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
        miniflare: {
          bindings: {
            ZOOM_VIDEO_SDK_KEY: 'test-zoom-sdk-key',
            ZOOM_VIDEO_SDK_SECRET: 'test-zoom-sdk-secret',
            ZOOM_API_KEY: 'test-zoom-api-key',
            ZOOM_API_SECRET: 'test-zoom-api-secret',
            GOOGLE_CLIENT_ID: 'test-google-id',
            GOOGLE_CLIENT_SECRET: 'test-google-secret',
            BETTER_AUTH_SECRET: 'test-auth-secret',
            BETTER_AUTH_URL: 'http://localhost:8787',
            CORS_ORIGIN: 'http://localhost:5173',
            GROQ_API_KEY: 'test-groq-key',
            SPEECHMATICS_API_KEY: 'test-speechmatics-key',
            ALLOWED_EMAILS: '',
            IS_DEV: '',
            LOCAL_DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
          },
        },
      },
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@webmoti-employ/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
})
