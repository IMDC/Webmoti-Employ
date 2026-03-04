import type { NotificationState } from '../../ai/NotificationState'
import { useEffect } from 'react'
import { logger } from '@/utils/logger'

/** Minimum interviewee words before filler warning can trigger */
const FILLER_MIN_WORDS = 10

/** Filler-to-word ratio threshold (8%) */
const FILLER_THRESHOLD = 0.08

/**
 * Derives whether to show a filler-word warning from the aggregated notification.
 * Only applies to interviewee notifications; always false for interviewer.
 */
export function useFillerWarning(notification: NotificationState) {
  const fillerCount = notification.role === 'interviewee' ? notification.fillerCount : 0
  const wordCount = notification.role === 'interviewee' ? notification.wordCount : 0

  const showFillerWarning = wordCount >= FILLER_MIN_WORDS
    && fillerCount / wordCount >= FILLER_THRESHOLD

  useEffect(() => {
    logger.log('[useFillerWarning] filler tracking:', {
      fillerCount,
      wordCount,
      pct: wordCount > 0
        ? `${(fillerCount / wordCount * 100).toFixed(1)}%`
        : '0%',
      showFillerWarning,
    })
  }, [fillerCount, wordCount, showFillerWarning])

  return showFillerWarning
}
