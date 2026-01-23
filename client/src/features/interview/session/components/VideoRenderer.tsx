import type { VideoPlayer } from '@zoom/videosdk'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useRef } from 'react'
import { isElectron } from '@/utils/utils'
import { FaceBlurOverlay } from './FaceBlurOverlay'

interface VideoRendererProps {
  attach: (el: VideoPlayer) => Promise<VideoPlayer | void>
  detach: () => void
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

    const setup = async () => {
      // attach video from zoom
      const result = await attach(el)

      if (!isHost) {
        return
      }
      const player = result ?? el
      const videoElement = player.querySelector('video')
      if (videoElement) {
        // the host video will be used higher in the tree for face detection
        setHostVideo(videoElement)
      }
    }

    setup()

    return () => {
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
