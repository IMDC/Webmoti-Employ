import { useEffect, useState } from 'react'
import { isElectron } from '@/utils/utils'

export function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([])

  useEffect(() => {
    if (!isElectron())
      return

    const unsubscribe = window.electron.subscribeToFeedback(setFeedback)
    return () => unsubscribe()
  }, [])

  return feedback
}
