import { useState } from 'react';
import { EndScreen } from '@/components/EndScreen';
import { PrejoinScreen } from '@/components/PrejoinScreen';
import { Room } from '@/components/Room';

export function VideoApp() {
  const [phase, setPhase] = useState('prejoin');

  return (
    <>
      {phase === 'prejoin' && <PrejoinScreen onJoin={() => setPhase('room')} />}

      {phase === 'room' && <Room onLeave={() => setPhase('prejoin')} />}

      {/* TODO use later */}
      {phase === 'end' && <EndScreen />}
    </>
  );
}
