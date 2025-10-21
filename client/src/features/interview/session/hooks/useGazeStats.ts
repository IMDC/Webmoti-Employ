import { useEffect, useState } from 'react'
import { isElectron } from '@/utils/utils'

export function useGazeStats() {
  const [stats, setStats] = useState<GazeStats | null>(null)

  useEffect(() => {
    if (!isElectron())
      return

    const unsubscribe = window.electron.subscribeToGazeStats(setStats)
    return () => unsubscribe()
  }, [])

  return stats
}

