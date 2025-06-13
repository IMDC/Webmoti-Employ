import { AppShell } from '@mantine/core';
import { MenuBar } from './MenuBar';
import { VideoGrid } from './VideoGrid';

interface RoomProps {
  onLeave: () => void;
}

export function Room({ onLeave }: RoomProps) {
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
        <MenuBar onToggleMic={() => {}} onToggleVideo={() => {}} onLeave={onLeave} />
      </AppShell.Footer>
    </AppShell>
  );
}
