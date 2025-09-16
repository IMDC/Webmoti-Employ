import { useEffect, useState } from 'react'
import { GALLERY_VIEW_ASPECT_RATIO, GALLERY_VIEW_MARGIN } from '@/utils/constants'
import { useContainerDimensions } from './useContainerDimensions'

export function useSingleLayout(containerRef: React.RefObject<HTMLDivElement | null>) {
  const { width: rawWidth, height: rawHeight } = useContainerDimensions(containerRef)
  const [participantVideoSize, setParticipantVideoSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!rawWidth || !rawHeight)
      return

    const usableWidth = rawWidth - GALLERY_VIEW_MARGIN * 2
    const usableHeight = rawHeight - GALLERY_VIEW_MARGIN * 2

    let width = usableWidth
    let height = width / GALLERY_VIEW_ASPECT_RATIO

    if (height > usableHeight) {
      height = usableHeight
      width = height * GALLERY_VIEW_ASPECT_RATIO
    }

    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setParticipantVideoSize({ width, height })
  }, [rawWidth, rawHeight])

  return participantVideoSize
}
