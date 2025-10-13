import { useEffect, useState } from 'react'

export function useVolumeLevel(getVolume?: () => number, intervalMs = 200) {
  const [volume, setVolume] = useState(0)

  // polling to update volume indicator
  useEffect(() => {
    if (!getVolume)
      return

    const interval = window.setInterval(() => {
      const vol = getVolume() || 0
      setVolume(vol)
    }, intervalMs)

    return () => {
      clearInterval(interval)
    }
  }, [getVolume, intervalMs])

  return volume
}
