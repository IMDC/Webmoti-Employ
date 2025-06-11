import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { ErrorDialog } from './components/ErrorDialog';
import { Router } from './Router';
import { theme } from './theme';

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Router />
      <ErrorDialog />
    </MantineProvider>
  );
}
