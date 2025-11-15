import { createBrowserHistory, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const history = createBrowserHistory()

export const router = createRouter({ history, routeTree, notFoundMode: 'root' })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
