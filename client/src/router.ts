import { createBrowserHistory, createHashHistory, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const isElectron = import.meta.env.VITE_IS_ELECTRON === 'true'

// hash history is needed for electron since it loads from "file://"
const history = isElectron
  ? createHashHistory()
  : createBrowserHistory()

export const router = createRouter({ history, routeTree, notFoundMode: 'root' })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
