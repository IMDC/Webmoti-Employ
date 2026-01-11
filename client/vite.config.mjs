import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

let commitHash = 'local'
let commitDate = 'unknown'
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim()
  const rawCommitDate = execSync(`git show -s --format=%ci ${commitHash}`)
    .toString()
    .trim()
  commitDate = new Date(rawCommitDate).toISOString()
}
catch {}

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
    __APP_VERSION__: JSON.stringify(clientPkg.version ?? '0.0.0'),
    __APP_SHA__: JSON.stringify(commitHash),
    __APP_COMMIT_DATE__: JSON.stringify(commitDate),
    __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
})
