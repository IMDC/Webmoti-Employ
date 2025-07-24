import { useEffect, useRef } from 'react'
import { isElectron } from '@/utils/utils'
import { FaceDetectorRunner } from './FaceDetectorRunner'

export function useFaceDetection(hostVideo: HTMLVideoElement | null) {
  const runnerRef = useRef<FaceDetectorRunner | null>(null)

  useEffect(() => {
    if (!isElectron() || !hostVideo)
      return

    const startDetection = () => {
      if (hostVideo.videoWidth === 0 || hostVideo.videoHeight === 0)
        return

      // you can increase this to run detection more often
      const DETECTION_FPS = 5
      const runner = new FaceDetectorRunner(hostVideo, DETECTION_FPS)
      runnerRef.current = runner
      runner.init()
    }

    // wait until video is loaded
    if (hostVideo.readyState >= 2) {
      startDetection()
    }
    else {
      hostVideo.addEventListener('loadeddata', startDetection)
    }

    return () => {
      runnerRef.current?.stop()
      hostVideo.removeEventListener('loadeddata', startDetection)
    }
  }, [hostVideo])
}
