import { useEffect, useRef, useState } from 'react'
import { isElectron } from '@/utils/utils'
import { FaceDetectorRunner } from './FaceDetectorRunner'

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function getFeedbackBoxAsNormalizedAOI(): FaceDetectionBoundingBox | null {
  const el = document.getElementById('feedback-safe-aoi')
  if (!el)
    return null

  const rect = el.getBoundingClientRect()
  const screenW = window.screen.width
  const screenH = window.screen.height
  if (!screenW || !screenH)
    return null

  const x = clamp01((window.screenX + rect.left) / screenW)
  const y = clamp01((window.screenY + rect.top) / screenH)
  const right = clamp01((window.screenX + rect.right) / screenW)
  const bottom = clamp01((window.screenY + rect.bottom) / screenH)

  const width = Math.max(0, right - x)
  const height = Math.max(0, bottom - y)
  if (width === 0 || height === 0)
    return null

  return { x, y, width, height }
}

export function useFaceDetection(hostVideo: HTMLVideoElement | null, fps: number) {
  const runnerRef = useRef<FaceDetectorRunner | null>(null)
  const [detectionResult, setDetectionResult] = useState<InterviewerCoordinates | null>(null)

  function handleFaceDetection(data: InterviewerCoordinates) {
    setDetectionResult(data)

    // Face AOI (existing behavior)
    window.electron.sendInterviewerCoordinates(data)

    // Separate safe AOI for feedback area (no union rectangle)
    window.electron.sendFeedbackSafeAoi(getFeedbackBoxAsNormalizedAOI())
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
      window.electron.sendFeedbackSafeAoi(null)
    }
  }, [hostVideo, fps])

  return detectionResult
}
