import { useEffect, useRef, useState } from 'react'
import { isElectron } from '@/utils/utils'
import { FaceDetectorRunner } from './FaceDetectorRunner'

export function useFaceDetection(hostVideo: HTMLVideoElement | null, fps: number) {
  const runnerRef = useRef<FaceDetectorRunner | null>(null)
  const [detectionResult, setDetectionResult] = useState<InterviewerCoordinates | null>(null)

  function handleFaceDetection(data: InterviewerCoordinates) {
    setDetectionResult(data)
    // send coordinate data to electron
    window.electron.sendInterviewerCoordinates(data)
  }

  useEffect(() => {
    if (!isElectron() || !hostVideo)
      return

    const startDetection = () => {
      if (hostVideo.videoWidth === 0 || hostVideo.videoHeight === 0)
        return

      const runner = new FaceDetectorRunner(hostVideo, handleFaceDetection, fps)
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
  }, [hostVideo, fps])

  return detectionResult
}
