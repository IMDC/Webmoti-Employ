import '@mantine/core/styles.css';
import './global.css';

import { StrictMode } from 'react';
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ErrorDialog } from './components/ErrorDialog';
import { routeTree } from './routeTree.gen';
import { theme } from './theme';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

const App = () => (
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
        <QueryClientProvider client={queryClient}>
          <SignedIn>
            <RouterProvider router={router} />
            <ErrorDialog />
          </SignedIn>
          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
        </QueryClientProvider>
      </ClerkProvider>
    </MantineProvider>
  </StrictMode>
);

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
