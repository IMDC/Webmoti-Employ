import { useEffect, useRef, useState } from 'react'
import { useFeedback } from './useFeedback'

/** Grace period (ms) before switching to "not looking" */
const GRACE_MS = 2000

export type EyeContactStatus = 'good' | 'bad' | null

/**
 * Tracks eye-contact state from Electron feedback with a grace timer.
 * Returns the current status and calls `onLookingChange` when it changes.
 */
export function useEyeContact(onLookingChange?: (looking: boolean) => void): EyeContactStatus {
  const feedback = useFeedback()
  const looking = feedback.find(f => f.feedbackType === 'lookingAtInterviewer')?.isActive

  const [status, setStatus] = useState<EyeContactStatus>(null)
  const graceTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current)
      graceTimerRef.current = null
    }

    if (looking == null) {
      return
    }

    if (looking) {
      setStatus('good')
      onLookingChange?.(true)
      return
    }

    graceTimerRef.current = window.setTimeout(() => {
      setStatus('bad')
      onLookingChange?.(false)
    }, GRACE_MS)

    return () => {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current)
        graceTimerRef.current = null
      }
    }
  }, [looking, onLookingChange])

  return status
}
