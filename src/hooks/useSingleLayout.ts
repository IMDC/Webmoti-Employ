import { useEffect, useState } from 'react';
import { getFittedSize } from '@/utils';
import { GALLERY_VIEW_ASPECT_RATIO, GALLERY_VIEW_MARGIN } from '../constants';
import { useContainerDimensions } from './useContainerDimensions';

export function useSingleLayout(containerRef: React.RefObject<HTMLDivElement | null>) {
  const { width: rawWidth, height: rawHeight } = useContainerDimensions(containerRef);
  const [participantVideoSize, setParticipantVideoSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!rawWidth || !rawHeight) {
      return;
    }

    const usableWidth = rawWidth - GALLERY_VIEW_MARGIN * 2;
    const usableHeight = rawHeight - GALLERY_VIEW_MARGIN * 2;
    const [width, height] = getFittedSize(usableWidth, usableHeight, GALLERY_VIEW_ASPECT_RATIO);

    setParticipantVideoSize({ width, height });
  }, [rawWidth, rawHeight]);

  return participantVideoSize;
}
