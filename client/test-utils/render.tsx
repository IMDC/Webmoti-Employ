import type {
  RenderResult,
} from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render as rtlRender } from '@testing-library/react'
import { theme } from '../src/theme'

/** Creates a fresh QueryClient per test to avoid shared state. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  })
}

export interface RenderOptions {
  queryClient?: QueryClient
}

export function render(ui: React.ReactNode, options: RenderOptions = {}): RenderResult {
  const queryClient = options.queryClient ?? createTestQueryClient()

  return rtlRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </QueryClientProvider>
    ),
  })
}
