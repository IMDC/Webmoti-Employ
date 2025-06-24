import { SettingsMenu } from '@/features/video/components/SettingsMenu';
import { JoiningScreen } from '@/features/video/prejoin/JoiningScreen';
import { useZoomSessionStore } from '@/features/video/zoom/useZoomSessionStore';
import { ChatContextProvider } from './chat/ChatContextProvider';
import { EndScreen } from './end/EndScreen';
import { PrejoinScreen } from './prejoin/PrejoinScreen';
import { Room } from './session/Room';

export function VideoApp() {
  const callState = useZoomSessionStore((s) => s.callState);
  const joinZoom = useZoomSessionStore((s) => s.join);
  const leaveZoom = useZoomSessionStore((s) => s.leave);

  return (
    <>
      {callState === 'prejoin' && (
        <PrejoinScreen
          onJoin={async () => {
            await joinZoom('Joe', 'Test');
          }}
        />
      )}

      <JoiningScreen visible={callState === 'joining'} />

      {callState === 'joined' && (
        <ChatContextProvider>
          <Room
            onLeave={async () => {
              await leaveZoom();
            }}
          />
        </ChatContextProvider>
      )}

      {callState === 'left' && <EndScreen />}

      <SettingsMenu />
    </>
  );
}
