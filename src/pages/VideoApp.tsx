import { useEffect, useState } from 'react';
import { JoiningScreen } from '@/components/screens/JoiningScreen';
import { EndScreen } from '../components/screens/EndScreen';
import { PrejoinScreen } from '../components/screens/PrejoinScreen';
import { Room } from '../components/screens/Room';

export function VideoApp() {
  const [phase, setPhase] = useState('prejoin');

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
      {phase === 'prejoin' && <PrejoinScreen onJoin={() => setPhase('joining')} />}

      <JoiningScreen visible={phase === 'joining'} />

      {phase === 'room' && <Room onLeave={() => setPhase('prejoin')} />}

      {/* TODO use later */}
      {phase === 'end' && <EndScreen />}
    </>
  );
}
