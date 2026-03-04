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

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    // reset display value so feedback icon disappears immediately
    setSeconds(0)
  }, [])

  useEffect(() => {
    // start when a new topic is announced for the interviewee, and
    // make sure to stop the timer if we ever receive a notification
    // that isn’t for the interviewee (e.g. dev‑mode reviewer messages)
    if (notification.role === 'interviewee') {
      if (newTopic) {
        start()
      }
    }
    else {
      stop()
    }
  }, [notification.role, newTopic, start, stop])

  return seconds
}
