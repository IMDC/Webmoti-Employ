/* eslint-disable node/prefer-global/process */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const commitHash = process.env.APP_GIT_SHA ?? null
const commitDate = process.env.APP_GIT_COMMIT_DATE ?? null

const clientPkg = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf-8'),
)

export default defineConfig({
  base: '/',
  plugins: [
    // '@tanstack/router-plugin' needs to be passed before '@vitejs/plugin-react'
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tsconfigPaths(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
    // exclude playwright tests in tests/
    exclude: ['node_modules', 'dist', 'tests/**'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(clientPkg.version ?? null),
    __APP_SHA__: JSON.stringify(commitHash),
    __APP_COMMIT_DATE__: JSON.stringify(commitDate),
    __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
})
