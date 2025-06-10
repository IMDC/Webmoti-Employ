import { AppShell } from '@mantine/core';
import { MenuBar } from './MenuBar';
import { VideoGrid } from './VideoGrid';

export function Room() {
  return (
    <AppShell
      footer={{ height: 60 }}
      padding={0}
      style={{ minHeight: '100vh' }}
      styles={{
        main: { display: 'flex', flexDirection: 'column' },
      }}
    >
      <AppShell.Main>
        <VideoGrid />
      </AppShell.Main>

      <AppShell.Footer>
        <MenuBar onToggleMic={() => {}} onToggleVideo={() => {}} />
      </AppShell.Footer>
    </AppShell>
  );
}
