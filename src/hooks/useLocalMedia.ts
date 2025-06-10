import { useCallback, useEffect, useRef, useState } from 'react';
import { requestLocalMedia } from '../utils';

export function useLocalMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const acquire = useCallback(async () => {
    const s = await requestLocalMedia();
    if (s) {
      setStream(s);
      activeStreamRef.current = s;
    }
    return s;
  }, []);

  useEffect(() => {
    acquire();

    return () => {
      activeStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [acquire]);

  return { stream, acquire };
}
