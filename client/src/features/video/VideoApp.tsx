import { useEffect, useState } from 'react';
import { JoiningScreen } from '@/features/video/prejoin/JoiningScreen';
import { SettingsMenu } from '@/features/video/components/SettingsMenu';
import { useZoomVideoStore } from '@/stores/ZoomVideoStore';
import { PrejoinScreen } from './prejoin/PrejoinScreen';
import { Room } from './session/Room';
import { EndScreen } from './end/EndScreen';

export function VideoApp() {
  const callState = useZoomVideoStore((s) => s.callState);
  const joinZoom = useZoomVideoStore((s) => s.join);
  const leaveZoom = useZoomVideoStore((s) => s.leave);

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
        <Room
          onLeave={async () => {
            await leaveZoom();
          }}
        />
      )}

      {callState === 'left' && <EndScreen />}

      <SettingsMenu />
    </>
  );
}
