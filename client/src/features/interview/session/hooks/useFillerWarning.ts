import type { NotificationMessage } from '@webmoti-employ/shared'
import { useEffect } from 'react'
import { logger } from '@/utils/logger'

/** Minimum interviewee words before filler warning can trigger */
const FILLER_MIN_WORDS = 10

/** Filler-to-word ratio threshold (8%) */
const FILLER_THRESHOLD = 0.08

/**
 * Derives whether to show a filler-word warning from the aggregated notification.
 * Owns all threshold constants so they're easy to find and tune.
 */
export function useFillerWarning(notification: NotificationMessage) {
  const { fillerCount, wordCount } = notification

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
