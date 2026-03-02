import type { NotificationMessage } from '@webmoti-employ/shared'
import { useEffect } from 'react'
import { useCountup } from './useCountup'

/**
 * Drives a countup timer based on whether the current notification is a question.
 * Resets on new topics that contain a question; stops when no question is active.
 */
export function useQuestionCountup(notification: NotificationMessage) {
  const { isQuestion, newTopic } = notification
  const { countupSeconds, startCountup, stopCountup } = useCountup()

  // start countup if notification is a question
  useEffect(() => {
    if (isQuestion) {
      startCountup()
    }
    else {
      stopCountup()
    }
  }, [isQuestion, startCountup, stopCountup])

  // restart countup when a new topic arrives with a question
  useEffect(() => {
    if (newTopic && isQuestion) {
      startCountup()
    }
    else if (newTopic && !isQuestion) {
      stopCountup()
    }
  }, [newTopic, isQuestion, startCountup, stopCountup])

  return countupSeconds
}
