import '@mantine/core/styles.css';
import './frimousse.css';

import { MantineProvider } from '@mantine/core';
import { ErrorDialog } from './components/ErrorDialog';
import { VideoServiceProvider } from './contexts/VideoServiceContext';
import { Router } from './Router';
import { ZoomVideoService } from './services/ZoomVideoService';
import { theme } from './theme';

const videoService = new ZoomVideoService();

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <VideoServiceProvider value={videoService}>
        <Router />
        <ErrorDialog />
      </VideoServiceProvider>
    </MantineProvider>
  );
}
