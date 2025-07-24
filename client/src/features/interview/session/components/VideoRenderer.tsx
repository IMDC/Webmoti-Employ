import type { VideoPlayer } from '@zoom/videosdk'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useRef } from 'react'

interface VideoRendererProps {
  attach: (el: VideoPlayer) => Promise<VideoPlayer | void>
  detach: () => void
  setHostVideo?: Dispatch<SetStateAction<HTMLVideoElement | null>>
}

export function VideoRenderer({ attach, detach, setHostVideo }: VideoRendererProps) {
  const ref = useRef<VideoPlayer>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    const setup = async () => {
      // attach video from zoom
      const result = await attach(el)

      // if this VideoRenderer is the host, setHostVideo is defined
      if (!setHostVideo) {
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
      setHostVideo?.(null)
    }
  }, [attach, detach, setHostVideo])

  return (
    <video-player-container>
      <video-player ref={ref} />
    </video-player-container>
  )
}
