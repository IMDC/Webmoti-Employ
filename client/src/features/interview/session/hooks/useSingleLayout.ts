import { useMemo } from 'react'
import { GALLERY_VIEW_ASPECT_RATIO, GALLERY_VIEW_MARGIN } from '@/utils/constants'
import { useContainerDimensions } from './useContainerDimensions'

export function useSingleLayout(containerRef: React.RefObject<HTMLDivElement | null>) {
  const { width: rawWidth, height: rawHeight } = useContainerDimensions(containerRef)

  return useMemo(() => {
    if (!rawWidth || !rawHeight)
      return { width: 0, height: 0 }

    const usableWidth = rawWidth - GALLERY_VIEW_MARGIN * 2
    const usableHeight = rawHeight - GALLERY_VIEW_MARGIN * 2

    let width = usableWidth
    let height = width / GALLERY_VIEW_ASPECT_RATIO

    if (height > usableHeight) {
      height = usableHeight
      width = height * GALLERY_VIEW_ASPECT_RATIO
    }

    return { width, height }
  }, [rawWidth, rawHeight])
}
