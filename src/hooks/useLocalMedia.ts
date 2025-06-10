import { useEffect, useState } from 'react';
import { useAppStore } from '../store';

export function useLocalMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const setError = useAppStore((state) => state.setError);

  useEffect(() => {
    let activeStream: MediaStream;

    const start = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(s);
        activeStream = s;
      } catch {
        setError('Could not access camera or microphone');
      }
    };

    start();

    return () => {
      activeStream?.getTracks().forEach((track) => track.stop());
    };
  }, [setError]);

  return stream;
}
