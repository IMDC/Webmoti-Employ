import { useZoomVideoStore } from '@/stores/ZoomVideoStore';
import { GALLERY_VIEW_ASPECT_RATIO } from '../constants';
import useGalleryViewLayout from '../hooks/useGalleryViewLayout';
import { ParticipantTile } from './ParticipantTile';

interface VideoGridProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function VideoGrid({ containerRef }: VideoGridProps) {
  const participants = useZoomVideoStore((store) => store.participants);

  const participantCount = participants.size;
  const { participantVideoWidth } = useGalleryViewLayout(participantCount, containerRef);

  const participantHeight = participantVideoWidth * GALLERY_VIEW_ASPECT_RATIO;

  return (
    <>
      {Array.from(participants.entries()).map(([id, participant]) => (
        <ParticipantTile
          key={id}
          height={participantHeight}
          width={participantVideoWidth}
          participant={participant}
        />
      ))}
    </>
  );
}
