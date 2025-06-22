import { useRef, useState } from 'react';
import { AppShell, Box } from '@mantine/core';
import { GALLERY_VIEW_MARGIN } from '@/constants';
import { VideoGrid } from './components/VideoGrid';
import { Chat } from '../chat/Chat';
import { MenuBar } from '../components/MenuBar';

interface RoomProps {
  onLeave: () => void;
}

export function Room({ onLeave }: RoomProps) {
  const participantStageRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <AppShell
      footer={{ height: '60px' }}
      styles={{
        main: { height: 'calc(100vh - 60px)' },
      }}
    >
      <AppShell.Main>
        <Box
          style={{
            display: 'flex',
            height: '100%',
          }}
        >
          <Box
            ref={participantStageRef}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignContent: 'center',
              gap: GALLERY_VIEW_MARGIN,
              padding: GALLERY_VIEW_MARGIN,
              background: '#111',
              flex: 1,
              minWidth: 0,
            }}
          >
            <VideoGrid containerRef={participantStageRef} />
          </Box>

          {isChatOpen && (
            <Box
              style={{
                width: '30%',
                height: '100%',
                background: '#111',
              }}
            >
              <Chat />
            </Box>
          )}
        </Box>
      </AppShell.Main>

      <AppShell.Footer>
        <MenuBar
          onToggleMic={() => {}}
          onToggleVideo={() => {}}
          onLeave={onLeave}
          onToggleChat={() => {
            setIsChatOpen(!isChatOpen);
          }}
        />
      </AppShell.Footer>
    </AppShell>
  );
}
