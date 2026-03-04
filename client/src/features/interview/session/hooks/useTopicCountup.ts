import type { NotificationState } from '../../ai/NotificationState'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Counts seconds since the current topic started.
 * Resets and restarts on each new topic. Only applies to interviewee notifications.
 */
export function useTopicCountup(notification: NotificationState) {
  const newTopic = notification.role === 'interviewee' ? notification.newTopic : false

  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setSeconds(0)
    intervalRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000)
  }, [])

  useEffect(() => {
    if (newTopic) {
      start()
    }
  }, [newTopic, start])

  return seconds
}
