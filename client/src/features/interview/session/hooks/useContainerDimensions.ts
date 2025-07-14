import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

export function useContainerDimensions(containerRef: React.RefObject<HTMLElement | null>) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const updateLayout = useCallback(() => {
    if (!containerRef.current) {
      return
    }
    setDimensions({
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    })
  }, [containerRef])

  useEffect(() => {
    const observer = new window.ResizeObserver(updateLayout)
    observer.observe(containerRef.current!)
    return () => {
      observer.disconnect()
    }
  }, [updateLayout, containerRef])

  useLayoutEffect(updateLayout, [updateLayout])

  return dimensions
}
