import { useZoomVideoStore } from '@/stores/ZoomVideoStore';
import { GALLERY_VIEW_ASPECT_RATIO } from '../constants';
import useGalleryViewLayout from '../hooks/useGalleryViewLayout';
import { ParticipantTile } from './ParticipantTile';
import { VideoRenderer } from './VideoRenderer';
import { useCallback } from 'react';
import { VideoPlayer } from '@zoom/videosdk';

interface VideoGridProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function VideoGrid({ containerRef }: VideoGridProps) {
  const participants = useZoomVideoStore((store) => store.participants);
  const attach  = useZoomVideoStore((store) => store.attachVideoPlayer);
  const detach = useZoomVideoStore((store) => store.detachVideoPlayer);

  const participantCount = participants.size;
  const { participantVideoWidth } = useGalleryViewLayout(participantCount, containerRef);

  const participantHeight = participantVideoWidth * GALLERY_VIEW_ASPECT_RATIO;

   return (
    <>
      {Array.from(participants.entries()).map(([userId, participant]) => {
        const attachStable = useCallback((el: VideoPlayer) => attach(userId, el), [attach, userId]);
        const detachStable = useCallback(() => detach(userId), [detach, userId]);

        return (
          <ParticipantTile
            key={userId}
            height={participantHeight}
            width={participantVideoWidth}
            name={participant.displayName}
          >
            <VideoRenderer attach={attachStable} detach={detachStable} />
          </ParticipantTile>
        );
      })}
    </>
  );
}