import { useZoomSessionStore } from '@/features/interview/zoom/useZoomSessionStore';
import { GALLERY_VIEW_ASPECT_RATIO } from '../../../../constants';
import useGalleryViewLayout from '../hooks/useGalleryViewLayout';
import { SessionTile } from './SessionTile';

interface VideoGridProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function VideoGrid({ containerRef }: VideoGridProps) {
  const participants = useZoomSessionStore((store) => store.participants);

  const participantCount = participants.size;
  const { participantVideoWidth } = useGalleryViewLayout(participantCount, containerRef);

  const participantHeight = participantVideoWidth * GALLERY_VIEW_ASPECT_RATIO;

  return (
    <>
      {Array.from(participants.entries()).map(([userId, participant]) => {
        return (
          <SessionTile
            key={userId}
            height={participantHeight}
            width={participantVideoWidth}
            participant={participant}
          />
        );
      })}
    </>
  );
}
