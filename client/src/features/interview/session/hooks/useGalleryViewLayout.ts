import { useEffect, useState } from 'react'
import { GALLERY_VIEW_ASPECT_RATIO, GALLERY_VIEW_MARGIN } from '@/utils/constants'
import { useContainerDimensions } from './useContainerDimensions'

/**
 * This function determines how many columns and rows are to be used
 * for the gallery view layout given a specific video size.
 */

export function layoutIsTooSmall(newVideoSize: number, participantCount: number, containerWidth: number, containerHeight: number) {
  const videoWidth = newVideoSize
  const videoHeight = newVideoSize / GALLERY_VIEW_ASPECT_RATIO

  const columns = Math.floor(containerWidth / videoWidth)
  const rows = Math.ceil(participantCount / columns)

  // Return false if the new gallery view size is taller than the app's container:
  return rows * videoHeight <= containerHeight
}

/**
 * This hook returns the appropriate width for each participant's video.
 * The actual layout is determined by CSS Flexbox.
 * This ensures that the gallery view of participants' videos will always fit within the given screen size.
 */

export default function useGalleryViewLayout(
  participantCount: number,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const { width: rawWidth, height: rawHeight } = useContainerDimensions(containerRef)
  const [participantVideoWidth, setParticipantVideoWidth] = useState(0)

  useEffect(() => {
    if (rawWidth === 0 || rawHeight === 0) {
      return
    }

    const containerWidth = rawWidth - GALLERY_VIEW_MARGIN * 2
    // Ensure participant tiles cannot be collapsed down to 0 by giving the container a minimum height of 75:
    const containerHeight = Math.max(rawHeight - GALLERY_VIEW_MARGIN * 2, 75)

    // Here we use binary search to guess the new size of each video in the gallery view
    // so that they all fit nicely for any screen size up to a width of 16384px.
    let minVideoWidth = 0
    let maxVideoWidth = 2 ** 14
    while (maxVideoWidth - minVideoWidth > 1) {
      const mid = (maxVideoWidth - minVideoWidth) / 2 + minVideoWidth
      const isLower = layoutIsTooSmall(mid, participantCount, containerWidth, containerHeight)

      if (isLower) {
        minVideoWidth = mid
      }
      else {
        maxVideoWidth = mid
      }
    }

    const finalWidth = Math.ceil(minVideoWidth) - GALLERY_VIEW_MARGIN * 2
    setParticipantVideoWidth(finalWidth)
  }, [rawWidth, rawHeight, participantCount])

  return {
    participantVideoWidth,
  }
}
