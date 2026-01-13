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

  interface NavigationState {
    canGoBack: boolean
    canGoForward: boolean
  }

  interface ElectronBuildInfo {
    version: string
    sha: string
    commitDate: string
    buildDate: string
  }

  interface EventPayloadMapping {
    feedback: Feedback[]
    coordinates: InterviewerCoordinates
    getModelBuffer: ArrayBuffer
    setRendererReady: undefined
    openExternalUrl: string
    gazeStats: GazeStats
    log: string
    electronBuildInfo: ElectronBuildInfo

    reloadWindow: undefined
    goBackWindow: undefined
    goForwardWindow: undefined
    toggleConsoleWindow: undefined
    navigationState: NavigationState
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
      getBuildInfo: () => Promise<ElectronBuildInfo>

      reloadWindow: () => void
      goBackWindow: () => void
      goForwardWindow: () => void
      toggleConsoleWindow: () => void
      subscribeToNavigation: (callback: (nav: NavigationState) => void) => UnsubscribeFunction
    }
  }
}
