import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// mode is either production, development, or electron
export default defineConfig(({ mode }) => {
  // eslint-disable-next-line node/prefer-global/process
  const env = loadEnv(mode, process.cwd(), '')

  const isElectron = env.VITE_IS_ELECTRON === 'true'

  return {
    // electron needs relative paths, but web needs absolute
    base: isElectron ? './' : '/',
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
    resolve: {
      alias: {
      // fix for tabler/icons-react slowing down vite dev (https://github.com/tabler/tabler-icons/issues/1233#issuecomment-2428245119)
      // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      },
    },
  }
})
