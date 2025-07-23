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

  interface Window {
    electron: {
      subscribeToFeedback: (callback: (feedback: Feedback) => void) => void
      sendInterviewerCoordinates: (coordinates: InterviewerCoordinates) => void
    }
  }
}
