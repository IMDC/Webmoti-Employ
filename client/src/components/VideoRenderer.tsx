import { useEffect, useRef } from 'react';
import { useZoomVideoStore } from '@/stores/ZoomVideoStore';

interface VideoRendererProps {
  userId: number;
}

export function VideoRenderer({ userId }: VideoRendererProps) {
  const ref = useRef<HTMLDivElement>(null);
  const createVideoPlayer = useZoomVideoStore((s) => s.createVideoPlayer);
  const detachVideoPlayer = useZoomVideoStore((s) => s.detachVideoPlayer);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    let mounted = true;

    createVideoPlayer(userId).then((videoEl) => {
      if (mounted && videoEl) {
        el.innerHTML = '';
        el.appendChild(videoEl);
      }
    });

    return () => {
      mounted = false;
      detachVideoPlayer(userId);
      if (el) {
        el.innerHTML = '';
      }
    };
  }, [userId, createVideoPlayer, detachVideoPlayer]);

  return (
    <div className="video-player-container">
      <div className="video-player" ref={ref} />
    </div>
  );
}
