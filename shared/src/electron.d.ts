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

  interface EventPayloadMapping {
    feedback: Feedback[]
    coordinates: InterviewerCoordinates
    getModelBuffer: ArrayBuffer
  }

  type UnsubscribeFunction = () => void

  interface Window {
    electron: {
      subscribeToFeedback: (callback: (feedback: Feedback[]) => void) => UnsubscribeFunction
      sendInterviewerCoordinates: (coordinates: InterviewerCoordinates) => void
      getModelBuffer: () => Promise<ArrayBuffer>
    }
  }
}
