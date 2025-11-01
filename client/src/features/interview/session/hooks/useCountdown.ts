import { useCallback, useRef, useState } from 'react'

export function useCountdown() {
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setSeconds(0)
  }, [])

  const start = useCallback((seconds: number) => {
    stop()
    setSeconds(seconds)

    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [stop])

  return { countdownSeconds: seconds, startCountdown: start, stopCountdown: stop }
}
