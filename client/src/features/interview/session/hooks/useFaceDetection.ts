import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import { useEffect } from 'react'
import { isElectron } from '@/utils/utils'

export function useFaceDetection() {
  useEffect(() => {
    async function setupFaceDetector() {
      // only run face detection in electron environment
      if (!isElectron()) {
        return
      }

      const electron = window.electron

      // eslint-disable-next-line no-console
      console.log(electron)

      const vision = await FilesetResolver.forVisionTasks(electron.getWasmPath())

      const faceDetector = await FaceDetector.createFromModelPath(vision, electron.getFaceModelPath())

      // eslint-disable-next-line no-console
      console.log(faceDetector)
    }

    setupFaceDetector()
  }, [])
}
