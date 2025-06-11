import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GALLERY_VIEW_ASPECT_RATIO, GALLERY_VIEW_MARGIN } from '../constants';

export default function useTopBarLayout(tileHeight: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilesThatFit, setTilesThatFit] = useState(0);

  const updateLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const width = container.offsetWidth - GALLERY_VIEW_MARGIN * 2;
    const tileWidth = tileHeight / GALLERY_VIEW_ASPECT_RATIO;

    const count = Math.floor(width / (tileWidth + GALLERY_VIEW_MARGIN));
    setTilesThatFit(Math.max(count, 0));
  }, [tileHeight]);

  useEffect(() => {
    const observer = new ResizeObserver(updateLayout);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [updateLayout]);

  useLayoutEffect(updateLayout, [updateLayout]);

  return { tilesThatFit, containerRef };
}
