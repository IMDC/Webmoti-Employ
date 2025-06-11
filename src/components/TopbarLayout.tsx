import { useState } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { Box, Button } from '@mantine/core';
import { GALLERY_VIEW_ASPECT_RATIO, GALLERY_VIEW_MARGIN } from '../constants';
import useGalleryViewLayout from '../hooks/useGalleryViewLayout';
import useTopBarLayout from '../hooks/useTopbarLayout';
import { ParticipantTile } from './ParticipantTile';

const TOP_BAR_HEIGHT = 150;
const TOP_BAR_TILE_HEIGHT = 125;
const ALL_TOPBAR_PARTICIPANTS = 12;

export function TopBarLayout() {
  const { participantVideoWidth, containerRef } = useGalleryViewLayout(1);
  const participantHeight = participantVideoWidth * GALLERY_VIEW_ASPECT_RATIO;

  const { tilesThatFit, containerRef: topBarRef } = useTopBarLayout(TOP_BAR_TILE_HEIGHT);

  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(ALL_TOPBAR_PARTICIPANTS / tilesThatFit);
  const start = page * tilesThatFit;
  const visibleParticipants = Array.from({ length: ALL_TOPBAR_PARTICIPANTS }).slice(
    start,
    start + tilesThatFit
  );

  const tileWidth = TOP_BAR_TILE_HEIGHT / GALLERY_VIEW_ASPECT_RATIO;

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Box
        ref={topBarRef}
        style={{
          height: TOP_BAR_HEIGHT,
          position: 'relative',
          background: '#111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `0 ${GALLERY_VIEW_MARGIN}px`,
          boxSizing: 'border-box',
        }}
      >
        {page > 0 && (
          <Button
            variant="subtle"
            size="md"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            style={{
              position: 'absolute',
              left: GALLERY_VIEW_MARGIN,
              zIndex: 1,
            }}
          >
            <IconChevronLeft size={24} />
          </Button>
        )}

        <Box
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: GALLERY_VIEW_MARGIN,
            overflow: 'hidden',
          }}
        >
          {visibleParticipants.map((_, i) => (
            <ParticipantTile key={start + i} width={tileWidth} height={TOP_BAR_TILE_HEIGHT} />
          ))}
        </Box>

        {page < totalPages - 1 && (
          <Button
            variant="subtle"
            size="md"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            style={{
              position: 'absolute',
              right: GALLERY_VIEW_MARGIN,
              zIndex: 1,
            }}
          >
            <IconChevronRight size={24} />
          </Button>
        )}
      </Box>

      <Box
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#111',
          padding: GALLERY_VIEW_MARGIN,
          overflow: 'hidden',
        }}
      >
        <ParticipantTile width={participantVideoWidth} height={participantHeight} />
      </Box>
    </Box>
  );
}
