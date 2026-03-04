/**
 * Client-side notification states, discriminated by role.
 * The server sends different payloads to each role, so each gets its own shape.
 */

export interface InterviewerNotificationState {
  role: 'interviewer'
  hint: string[]
}

export interface IntervieweeNotificationState {
  role: 'interviewee'
  hint: string[]
  fillerCount: number
  wordCount: number
  newTopic: boolean
  offTopic: boolean
}

export type NotificationState = InterviewerNotificationState | IntervieweeNotificationState

export const DEFAULT_INTERVIEWER_STATE: InterviewerNotificationState = {
  role: 'interviewer',
  hint: [],
}

export const DEFAULT_INTERVIEWEE_STATE: IntervieweeNotificationState = {
  role: 'interviewee',
  hint: [],
  fillerCount: 0,
  wordCount: 0,
  newTopic: false,
  offTopic: false,
}
