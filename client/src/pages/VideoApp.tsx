import { useEffect, useState } from 'react';
import { JoiningScreen } from '@/components/screens/JoiningScreen';
import { SettingsMenu } from '@/components/SettingsMenu';
import { useVideoServiceContext } from '@/contexts/VideoServiceContext';
import { EndScreen } from '../components/screens/EndScreen';
import { PrejoinScreen } from '../components/screens/PrejoinScreen';
import { Room } from '../components/screens/Room';

export function VideoApp() {
  const [phase, setPhase] = useState('prejoin');

  const videoService = useVideoServiceContext();

  // fake join timer
  useEffect(() => {
    if (phase === 'joining') {
      const timeout = setTimeout(() => {
        setPhase('room');
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [phase]);

  return (
    <>
      {phase === 'prejoin' && (
        <PrejoinScreen
          onJoin={async () => {
            setPhase('joining');
            await videoService.join('Joe', 'TestRoom');
          }}
        />
      )}

      <JoiningScreen visible={phase === 'joining'} />

      {phase === 'room' && (
        <Room
          onLeave={async () => {
            await videoService.leave();
            setPhase('prejoin');
          }}
        />
      )}

      {/* TODO use later */}
      {phase === 'end' && <EndScreen />}

      <SettingsMenu />
    </>
  );
}
