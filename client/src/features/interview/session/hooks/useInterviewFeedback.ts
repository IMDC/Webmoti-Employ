import type { NotificationState } from '../../ai/NotificationState'
import type { EyeContactStatus } from './useEyeContact'
import { useEyeContact } from './useEyeContact'
import { useFillerWarning } from './useFillerWarning'
import { useTopicCountup } from './useTopicCountup'

export interface InterviewFeedback {
  /** Hint keywords for the current topic (empty when none) */
  hint: string[]
  showHint: boolean
  showOffTopic: boolean
  showFillerWarning: boolean
  /** Seconds since the current topic started (0 when idle) */
  countupSeconds: number
  /** Eye-contact status: 'good' | 'bad' | null (no data) */
  eyeContact: EyeContactStatus
}

/**
 * Composes all interview feedback signals into one render-ready result.
 * This is the single source of truth for "what feedback does the participant see?"
 */
export function useInterviewFeedback(
  notification: NotificationState,
  onLookingChange?: (looking: boolean) => void,
): InterviewFeedback {
  const showFillerWarning = useFillerWarning(notification)
  const countupSeconds = useTopicCountup(notification)
  const eyeContact = useEyeContact(onLookingChange)

  const offTopic = notification.role === 'interviewee' ? notification.offTopic : false

  return {
    hint: notification.hint,
    showHint: notification.hint.length > 0,
    showOffTopic: offTopic,
    showFillerWarning,
    countupSeconds,
    eyeContact,
  }
}
