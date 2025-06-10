import { Box, Paper, Text } from '@mantine/core';
import { GALLERY_VIEW_ASPECT_RATIO, GALLERY_VIEW_MARGIN } from '../constants';
import useGalleryViewLayout from '../hooks/useGalleryViewLayout';

export function VideoGrid() {
  const participantCount = 2;
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
        background: '#000',
        flex: 1,
        overflow: 'auto',
      }}
    >
      {Array.from({ length: participantCount }).map((_, i) => (
        <Paper
          key={i}
          withBorder
          style={{
            width: participantVideoWidth,
            height: participantHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text>Participant {i + 1}</Text>
        </Paper>
      ))}
    </Box>
  );
}
