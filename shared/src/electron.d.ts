export {}

declare global {
  interface Feedback {
    feedbackType: 'fixation' | 'speech' | 'lookingAtInterviewer'
    isActive: boolean
  }

  interface FaceDetectionBoundingBox {
    x: number
    y: number
    width: number
    height: number
  }

  interface InterviewerCoordinates {
    found: boolean
    boundingBox: FaceDetectionBoundingBox
  }

  interface GazeStats {
    gazeOnInterviewerRatio: number
    windowSeconds: number
  }

  interface EventPayloadMapping {
    feedback: Feedback[]
    coordinates: InterviewerCoordinates
    getModelBuffer: ArrayBuffer
    setRendererReady: undefined
    gazeStats: GazeStats
    log: string
  }

  type UnsubscribeFunction = () => void

  interface Window {
    electron: {
      subscribeToFeedback: (callback: (feedback: Feedback[]) => void) => UnsubscribeFunction
      subscribeToGazeStats: (callback: (stats: GazeStats) => void) => UnsubscribeFunction
      sendInterviewerCoordinates: (coordinates: InterviewerCoordinates) => void
      getModelBuffer: () => Promise<ArrayBuffer>
      subscribeToLogs: (callback: (message: string) => void) => UnsubscribeFunction
      setRendererReady: () => void
    }
  }
}
