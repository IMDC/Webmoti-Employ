import type { NotificationMessage } from '@webmoti-employ/shared'
import { NotificationMessage as NotificationMessageSchema } from '@webmoti-employ/shared'
import { useCallback, useRef, useState } from 'react'
import { logger } from '@/utils/logger'

/** Number of recent notifications to consider for filler percentage */
const FILLER_WINDOW_SIZE = 5

/**
 * Aggregates raw AI notification messages into a single notification state.
 *
 * Handles:
 * - Sliding window of filler/word counts (size FILLER_WINDOW_SIZE, reset on newTopic)
 * - Hint persistence (keeps previous hints until new ones arrive)
 * - Question stickiness (stays true until a new topic resets it)
 */
export function useNotificationState() {
  const [notification, setNotification] = useState<NotificationMessage>(
    NotificationMessageSchema.parse({}),
  )

  // Ring buffer of recent { fillerCount, wordCount } for sliding window
  const recentRef = useRef<{ fillerCount: number, wordCount: number }[]>([])

  const processNotification = useCallback((incoming: NotificationMessage) => {
    // Update sliding window outside of state updater to avoid double-mutation
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

    setNotification((prev) => {
      if (incoming.newTopic) {
        return {
          hint: incoming.hint,
          isQuestion: incoming.isQuestion,
          fillerCount: totalFillers,
          wordCount: totalWords,
          newTopic: true,
          offTopic: false,
        }
      }

      return {
        hint: incoming.hint.length > 0 ? incoming.hint : prev.hint,
        isQuestion: prev.isQuestion || incoming.isQuestion,
        fillerCount: totalFillers,
        wordCount: totalWords,
        newTopic: false,
        offTopic: incoming.offTopic,
      }
    })

    logger.log('Processed notification:', incoming)
  }, [])

  return { notification, processNotification }
}
