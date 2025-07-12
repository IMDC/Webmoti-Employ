import { ClerkProvider } from '@clerk/clerk-react'
import { MantineProvider } from '@mantine/core'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'

import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { queryClient } from './query-client'
import { router } from './router'
import { theme } from './theme'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import './global.css'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

// eslint-disable-next-line react-refresh/only-export-components
function App() {
  return (
    <StrictMode>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} signInUrl="/sign-in">
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </ClerkProvider>
      </MantineProvider>
    </StrictMode>
  )
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<App />)
}
