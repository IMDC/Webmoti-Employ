import type { VideoPlayer } from '@zoom/videosdk'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useRef } from 'react'

interface VideoRendererProps {
  attach: (el: VideoPlayer) => Promise<VideoPlayer | void>
  detach: () => void
  setHostVideo?: Dispatch<SetStateAction<HTMLVideoElement | null>>
  userId?: number
}

export function VideoRenderer({ attach, detach, setHostVideo, userId }: VideoRendererProps) {
  const ref = useRef<VideoPlayer>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    let isMounted = true
    let retryTimeout: NodeJS.Timeout | null = null

    const setup = async (attempt = 0) => {
      try {
        // attach video from zoom
        const result = await attach(el)

        if (!isMounted) return

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
      catch (error: any) {
        // Error 6001 means video stream not ready yet - retry after delay
        if (error?.errorCode === 6001 && attempt < 5 && isMounted) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 3000) // Exponential backoff, max 3s
          retryTimeout = setTimeout(() => {
            if (isMounted) {
              setup(attempt + 1)
            }
          }, delay)
        }
        else if (error?.errorCode !== 6001) {
          // Log other errors but don't crash
          console.error('Failed to attach video player:', error)
        }
      }
    }

    setup()

    return () => {
      isMounted = false
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
      detach()
      setHostVideo?.(null)
    }
  }, [attach, detach, setHostVideo])

  return (
    <video-player-container>
      <video-player ref={ref} data-user-id={userId} />
    </video-player-container>
  )
}
