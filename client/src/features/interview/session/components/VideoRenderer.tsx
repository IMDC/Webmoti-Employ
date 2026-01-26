import type { VideoPlayer } from '@zoom/videosdk'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useRef } from 'react'
import { isElectron } from '@/utils/utils'
import { FaceBlurOverlay } from './FaceBlurOverlay'

interface VideoRendererProps {
  attach: (el: VideoPlayer) => Promise<void>
  detach: () => Promise<void>
  setHostVideo?: Dispatch<SetStateAction<HTMLVideoElement | null>>
  userId?: number
  faceDetectionResult?: InterviewerCoordinates | null
  isLookingAtInterviewer?: boolean
}

export function VideoRenderer({
  attach,
  detach,
  setHostVideo,
  userId,
  faceDetectionResult,
  isLookingAtInterviewer,
}: VideoRendererProps) {
  const ref = useRef<VideoPlayer>(null)

  const isElectronApp = isElectron()

  // if this VideoRenderer is the host, setHostVideo is defined
  const isHost = !!setHostVideo

  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    let cancelled = false

    const setup = async () => {
      // attach video from zoom
      await attach(el)

      if (cancelled || !isHost) {
        return
      }

      // the host video will be used higher in the tree for face detection
      const videoElement = el.querySelector('video')
      if (videoElement) {
        setHostVideo(videoElement)
      }
    }

    setup()

    return () => {
      cancelled = true
      detach()
      if (isHost) {
        setHostVideo?.(null)
      }
    }
  }, [attach, detach, setHostVideo, isHost])

  return (
    <video-player-container>
      <video-player ref={ref} data-user-id={userId} />

      {/* only blur background of interviewer */}
      {isElectronApp && isHost && (
        <FaceBlurOverlay
          faceDetectionResult={faceDetectionResult}
          isLookingAtInterviewer={isLookingAtInterviewer}
        />
      )}
    </video-player-container>
  )
}
