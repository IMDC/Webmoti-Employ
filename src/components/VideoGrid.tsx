import { Box } from '@mantine/core';
import { GALLERY_VIEW_ASPECT_RATIO, GALLERY_VIEW_MARGIN } from '../constants';
import useGalleryViewLayout from '../hooks/useGalleryViewLayout';
import { ParticipantTile } from './ParticipantTile';

export function VideoGrid() {
  const participantCount = 5;
  const { participantVideoWidth, containerRef } = useGalleryViewLayout(participantCount);

  const participantHeight = participantVideoWidth * GALLERY_VIEW_ASPECT_RATIO;

  return (
    <Box
      ref={containerRef}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
        gap: GALLERY_VIEW_MARGIN,
        padding: GALLERY_VIEW_MARGIN,
        background: '#111',
        flex: 1,
        overflow: 'auto',
      }}
    >
      {Array.from({ length: participantCount }).map((_, i) => (
        <ParticipantTile key={i} height={participantHeight} width={participantVideoWidth} />
      ))}
    </Box>
  );
}
