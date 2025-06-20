import { useEffect, useState } from 'react';
import { JoiningScreen } from '@/components/screens/JoiningScreen';
import { SettingsMenu } from '@/components/SettingsMenu';
import { useZoomVideoStore } from '@/stores/ZoomVideoStore';
import { EndScreen } from '../components/screens/EndScreen';
import { PrejoinScreen } from '../components/screens/PrejoinScreen';
import { Room } from '../components/screens/Room';

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
