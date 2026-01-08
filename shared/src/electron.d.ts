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
    openExternalUrl: string
    gazeStats: GazeStats
    log: string

    // toolbar controls
    reloadWindow: undefined
    goBackWindow: undefined
    goForwardWindow: undefined
    toggleConsoleWindow: undefined
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
      openExternalUrl: (url: string) => void

      reloadWindow: () => void
      goBackWindow: () => void
      goForwardWindow: () => void
      toggleConsoleWindow: () => void
    }
  }
}
