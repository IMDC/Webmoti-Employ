import '@mantine/core/styles.css';
import './global.css';

import { StrictMode } from 'react';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ErrorDialog } from './components/ErrorDialog';
import { routeTree } from './routeTree.gen';
import { theme } from './theme';

const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <RouterProvider router={router} />
        <ErrorDialog />
      </MantineProvider>
    </StrictMode>
  );
}
