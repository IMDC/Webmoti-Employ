import { useRef, useState } from 'react';
import { AppShell, Box } from '@mantine/core';
import { GALLERY_VIEW_MARGIN } from '@/constants';
import { useAppStore } from '@/stores/useAppStore';
import { useZoomPreviewStore } from '@/stores/usePreviewStore';
import { useZoomVideoStore } from '@/stores/useZoomVideoStore';
import { Chat } from '../chat/Chat';
import { MenuBar } from '../components/MenuBar';
import { VideoGrid } from './components/VideoGrid';

interface RoomProps {
  onLeave: () => void;
}

export function Room({ onLeave }: RoomProps) {
  const participantStageRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const permissionState = useAppStore((s) => s.permissionState);
  const isVideoOn = useAppStore((s) => s.isVideoOn);
  const setIsVideoOn = useAppStore((s) => s.setIsVideoOn);
  const isAudioOn = useAppStore((s) => s.isAudioOn);
  const setIsAudioOn = useAppStore((s) => s.setIsAudioOn);

  // TODO maybe remove this in favour of startVideo permission check
  const initDevices = useZoomPreviewStore((s) => s.initDevices);

  const startVideo = useZoomVideoStore((s) => s.startVideo);
  const stopVideo = useZoomVideoStore((s) => s.stopVideo);
  const startAudio = useZoomVideoStore((s) => s.startAudio);
  const stopAudio = useZoomVideoStore((s) => s.stopAudio);

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
          onToggleMic={async () => {
            if (permissionState !== 'granted') {
              await initDevices();
            }

            if (isAudioOn) {
              setIsAudioOn(false);
              await stopAudio();
            } else {
              setIsAudioOn(true);
              await startAudio();
            }
          }}
          onToggleVideo={async () => {
            if (permissionState !== 'granted') {
              await initDevices();
            }

            if (isVideoOn) {
              setIsVideoOn(false);
              await stopVideo();
            } else {
              setIsVideoOn(true);
              await startVideo();
            }
          }}
          onLeave={onLeave}
          onToggleChat={() => {
            setIsChatOpen(!isChatOpen);
          }}
        />
      </AppShell.Footer>
    </AppShell>
  );
}
