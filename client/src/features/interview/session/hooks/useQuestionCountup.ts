import type { NotificationMessage } from '@webmoti-employ/shared'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Counts seconds since the current question was asked.
 * Resets on new topics with a question; stops when no question is active.
 */
export function useQuestionCountup(notification: NotificationMessage) {
  const { isQuestion, newTopic } = notification

  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    stop()
    setSeconds(0)
    intervalRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000)
  }, [stop])

  useEffect(() => {
    if (isQuestion) {
      start()
    }
    else {
      stop()
    }
    // newTopic in deps ensures the timer restarts when a new topic arrives
    // with a question, even if isQuestion was already true.
  }, [isQuestion, newTopic, start, stop])

  return seconds
}
