import { useCallback, useEffect, useRef, useState } from 'react';
import { requestLocalMedia } from '../utils';

export function useLocalMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const acquire = useCallback(async () => {
    setIsAcquiring(true);
    try {
      const s = await requestLocalMedia();
      if (s) {
        setStream(s);
        activeStreamRef.current = s;
      }
      return s;
    } finally {
      setIsAcquiring(false);
    }
  }, []);

  const stopVideo = () => {
    const current = activeStreamRef.current;
    if (!current) {
      return;
    }

    current.getVideoTracks().forEach((track) => {
      track.stop();
      current.removeTrack(track);
    });
  };

  const startVideo = async () => {
    const videoStream = await requestLocalMedia({ video: true, audio: false });
    const videoTrack = videoStream?.getVideoTracks()[0];
    if (!videoTrack) {
      return;
    }

    let current = activeStreamRef.current;
    if (!current) {
      current = new MediaStream();
      activeStreamRef.current = current;
      setStream(current);
    }

    current.addTrack(videoTrack);
  };

  const stopAudio = () => {
    const current = activeStreamRef.current;
    if (!current) {
      return;
    }

    current.getAudioTracks().forEach((track) => {
      track.stop();
      current.removeTrack(track);
    });
  };

  const startAudio = async () => {
    const audioStream = await requestLocalMedia({ audio: true, video: false });
    const audioTrack = audioStream?.getAudioTracks()[0];
    if (!audioTrack) {
      return;
    }

    let current = activeStreamRef.current;
    if (!current) {
      current = new MediaStream();
      activeStreamRef.current = current;
      setStream(current);
    }

    current.addTrack(audioTrack);
  };

  useEffect(() => {
    acquire();

    return () => {
      activeStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [acquire]);

  return {
    stream,
    acquire,
    isAcquiring,
    startVideo,
    stopVideo,
    startAudio,
    stopAudio,
  };
}
