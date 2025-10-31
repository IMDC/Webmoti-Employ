import { useCallback, useRef, useState } from 'react'

export function useCountup() {
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

  return { countupSeconds: seconds, startCountup: start, stopCountup: stop }
}
