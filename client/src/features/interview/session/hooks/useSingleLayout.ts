import { useEffect, useState } from 'react'
import { GALLERY_VIEW_ASPECT_RATIO, GALLERY_VIEW_MARGIN } from '@/utils/constants'
import { getFittedSize } from '@/utils/utils'
import { useContainerDimensions } from './useContainerDimensions'

export function useSingleLayout(containerRef: React.RefObject<HTMLDivElement | null>) {
  const { width: rawWidth, height: rawHeight } = useContainerDimensions(containerRef)
  const [participantVideoSize, setParticipantVideoSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!rawWidth || !rawHeight) {
      return
    }

    const usableWidth = rawWidth - GALLERY_VIEW_MARGIN * 2
    const usableHeight = rawHeight - GALLERY_VIEW_MARGIN * 2
    const [width, height] = getFittedSize(usableWidth, usableHeight, GALLERY_VIEW_ASPECT_RATIO)

    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setParticipantVideoSize({ width, height })
  }, [rawWidth, rawHeight])

  return participantVideoSize
}
