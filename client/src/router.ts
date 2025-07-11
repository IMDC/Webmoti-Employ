import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export type FlowStage = 'prejoin' | 'interview' | 'done'

export const router = createRouter({ routeTree, notFoundMode: 'root' })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
  interface HistoryState {
    stage?: FlowStage
  }
}
