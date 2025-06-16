import { GALLERY_VIEW_ASPECT_RATIO } from '../constants';
import useGalleryViewLayout from '../hooks/useGalleryViewLayout';
import { ParticipantTile } from './ParticipantTile';

interface VideoGridProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function VideoGrid({ containerRef }: VideoGridProps) {
  const participantCount = 4;
  const { participantVideoWidth } = useGalleryViewLayout(participantCount, containerRef);

  const participantHeight = participantVideoWidth * GALLERY_VIEW_ASPECT_RATIO;

  return (
    <>
      {Array.from({ length: participantCount }).map((_, i) => (
        <ParticipantTile key={i} height={participantHeight} width={participantVideoWidth} />
      ))}
    </>
  );
}
