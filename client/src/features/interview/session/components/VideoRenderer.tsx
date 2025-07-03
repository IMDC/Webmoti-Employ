import { useEffect, useRef } from 'react';
import type { VideoPlayer } from '@zoom/videosdk';

interface VideoRendererProps {
  attach: (el: VideoPlayer) => Promise<void>;
  detach: () => void;
}

export function VideoRenderer({ attach, detach }: VideoRendererProps) {
  const ref = useRef<VideoPlayer>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    attach(el);

    return () => {
      detach();
    };
  }, [attach, detach]);

  return (
    <video-player-container>
      <video-player ref={ref} />
    </video-player-container>
  );
}
