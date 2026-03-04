import type { IntervieweeNotificationState, InterviewerNotificationState, NotificationState } from './NotificationState'
import { useCallback, useRef, useState } from 'react'
import { logger } from '@/utils/logger'
import { DEFAULT_INTERVIEWEE_STATE } from './NotificationState'

/** Number of recent notifications to consider for filler percentage */
const FILLER_WINDOW_SIZE = 5

/**
 * Aggregates raw AI notification messages into a single notification state.
 *
 * Handles:
 * - Interviewer: hint persistence only
 * - Interviewee: sliding window of filler/word counts (size FILLER_WINDOW_SIZE, reset on newTopic)
 *   and hint persistence
 */
export function useNotificationState() {
  const [notification, setNotification] = useState<NotificationState>(
    DEFAULT_INTERVIEWEE_STATE,
  )

  // Ring buffer of recent { fillerCount, wordCount } for sliding window (interviewee only)
  const recentRef = useRef<{ fillerCount: number, wordCount: number }[]>([])

  const processNotification = useCallback((incoming: NotificationState) => {
    if (incoming.role === 'interviewer') {
      setNotification((prev: NotificationState) => {
        const prevHint = prev.role === 'interviewer' ? prev.hint : []
        const state: InterviewerNotificationState = {
          role: 'interviewer',
          hint: incoming.hint.length > 0 ? incoming.hint : prevHint,
        }
        return state
      })
      logger.info('Processed interviewer notification:', incoming)
      return
    }

    // Interviewee path
    if (incoming.newTopic) {
      recentRef.current = [{ fillerCount: incoming.fillerCount, wordCount: incoming.wordCount }]
    }
    else {
      recentRef.current.push({ fillerCount: incoming.fillerCount, wordCount: incoming.wordCount })
      if (recentRef.current.length > FILLER_WINDOW_SIZE) {
        recentRef.current.shift()
      }
    }

    // Sum the window
    let totalFillers = 0
    let totalWords = 0
    for (const entry of recentRef.current) {
      totalFillers += entry.fillerCount
      totalWords += entry.wordCount
    }

    setNotification((prev: NotificationState) => {
      const prevHint = prev.hint
      if (incoming.newTopic) {
        const state: IntervieweeNotificationState = {
          role: 'interviewee',
          hint: incoming.hint,
          fillerCount: totalFillers,
          wordCount: totalWords,
          newTopic: true,
          offTopic: false,
        }
        return state
      }

      const state: IntervieweeNotificationState = {
        role: 'interviewee',
        hint: incoming.hint.length > 0 ? incoming.hint : prevHint,
        fillerCount: totalFillers,
        wordCount: totalWords,
        newTopic: false,
        offTopic: incoming.offTopic,
      }
      return state
    })

    logger.info('Processed interviewee notification:', incoming)
  }, [])

  return { notification, processNotification }
}
