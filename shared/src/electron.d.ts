export {}

declare global {
  interface Feedback {
    feedbackType: 'fixation' | 'speech'
  }

  interface InterviewerCoordinates {
    x: number
    y: number
  }

  interface EventPayloadMapping {
    feedback: Feedback
    coordinates: InterviewerCoordinates
  }

  type UnsubscribeFunction = () => void

  interface Window {
    electron: {
      subscribeToFeedback: (callback: (feedback: Feedback) => void) => UnsubscribeFunction
      sendInterviewerCoordinates: (coordinates: InterviewerCoordinates) => void
      // getFaceModelPath: () => string
      // getWasmPath: () => string
    }
  }
}
