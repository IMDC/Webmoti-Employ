import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'

export function useCurrentTime() {
  const [time, setTime] = useState(DateTime.now())

  useEffect(() => {
    const interval = setInterval(() => setTime(DateTime.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatted = time.toFormat('h:mm a')

  return formatted
}
