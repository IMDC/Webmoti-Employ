import type { RouterHistory } from '@tanstack/react-router'
import type { RenderResult } from '@testing-library/react'
import type { User } from '@/lib/auth-client'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { render as rtlRender } from '@testing-library/react'
import { UserContextProvider } from '@/features/auth/components/UserContextProvider'
import { theme } from '../src/theme'
import { createMockSession } from './factories'

interface RenderWithRouterOptions {
  initialPath?: string
  routes?: Array<{ path: string, component: React.ComponentType }>
}

/**
 * Renders a component with React Router context for integration tests
 * @param ui - Component to render
 * @param options - Router configuration options
 * @returns Render result with router utilities
 */
export function renderWithRouter(
  ui: React.ReactNode,
  options: RenderWithRouterOptions = {},
): RenderResult & { history: RouterHistory } {
  const { initialPath = '/' } = options

  const history = createMemoryHistory({ initialEntries: [initialPath] })

  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <>{ui}</>,
  })

  const router = createRouter({
    history,
    routeTree: rootRoute.addChildren([indexRoute]),
  })

  const result = rtlRender(
    <MantineProvider theme={theme}>
      <RouterProvider router={router} />
    </MantineProvider>,
  )

  return {
    ...result,
    history,
  }
}

/**
 * Renders a component with React Query context for integration tests
 * @param ui - Component to render
 * @param queryClient - Optional custom QueryClient instance
 * @returns Render result
 */
export function renderWithQuery(
  ui: React.ReactNode,
  queryClient?: QueryClient,
): RenderResult {
  const client = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return rtlRender(
    <MantineProvider theme={theme}>
      <QueryClientProvider client={client}>
        {ui}
      </QueryClientProvider>
    </MantineProvider>,
  )
}

interface RenderWithAuthOptions {
  userOverrides?: Partial<User>
}

/**
 * Renders a component with authentication context for integration tests
 * @param ui - Component to render
 * @param options - Authentication configuration options
 * @returns Render result
 */
export function renderWithAuth(
  ui: React.ReactNode,
  options: RenderWithAuthOptions = {},
): RenderResult {
  const { userOverrides } = options
  const session = createMockSession(userOverrides)

  return rtlRender(
    <MantineProvider theme={theme}>
      <UserContextProvider session={session}>
        {ui}
      </UserContextProvider>
    </MantineProvider>,
  )
}

interface RenderWithProvidersOptions {
  initialPath?: string
  userOverrides?: Partial<User>
  queryClient?: QueryClient
}

/**
 * Renders a component with all providers (Router, Query, Auth) for full integration tests
 * @param ui - Component to render
 * @param options - Configuration options for all providers
 * @returns Render result with router utilities
 */
export function renderWithProviders(
  ui: React.ReactNode,
  options: RenderWithProvidersOptions = {},
): RenderResult & { history: RouterHistory } {
  const { initialPath = '/', userOverrides, queryClient } = options

  const client = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const session = createMockSession(userOverrides)
  const history = createMemoryHistory({ initialEntries: [initialPath] })

  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <>{ui}</>,
  })

  const router = createRouter({
    history,
    routeTree: rootRoute.addChildren([indexRoute]),
  })

  const result = rtlRender(
    <MantineProvider theme={theme}>
      <QueryClientProvider client={client}>
        <UserContextProvider session={session}>
          <RouterProvider router={router} />
        </UserContextProvider>
      </QueryClientProvider>
    </MantineProvider>,
  )

  return {
    ...result,
    history,
  }
}
