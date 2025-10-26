import { useCallback, useRef, useState } from 'react'

export function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const intervalRef = useRef<number | null>(null)

  const start = useCallback((seconds: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setSecondsLeft(seconds)

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setSecondsLeft(null)
  }, [])

  return { secondsLeft, startCountdown: start, stopCountdown: stop }
}
