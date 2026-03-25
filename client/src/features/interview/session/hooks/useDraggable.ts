import { useCallback, useRef, useState } from 'react'

interface Position {
  x: number
  y: number
}

interface DragBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface UseDraggableOptions {
  topInset?: number
  rightInset?: number
  bottomInset?: number
  leftInset?: number
  margin?: number // Make margin configurable
}

/**
 * Makes an absolutely-positioned element draggable via pointer events.
 * Returns a ref to attach to the element and a style object with the
 * current translate offset + cursor.
 */
export function useDraggable(options: UseDraggableOptions = {}) {
  const {
    topInset = 0,
    rightInset = 0,
    bottomInset = 0,
    leftInset = 0,
    margin = 8, // Make margin configurable, default 8
  } = options

  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const draggingRef = useRef(false)
  const startPointerRef = useRef<Position>({ x: 0, y: 0 })
  const startPositionRef = useRef<Position>({ x: 0, y: 0 })
  const dragBoundsRef = useRef<DragBounds>({
    minX: Number.NEGATIVE_INFINITY,
    maxX: Number.POSITIVE_INFINITY,
    minY: Number.NEGATIVE_INFINITY,
    maxY: Number.POSITIVE_INFINITY,
  })

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true
      startPointerRef.current = { x: e.clientX, y: e.clientY }
      startPositionRef.current = { ...position }

      const element = e.currentTarget as HTMLElement
      const elementRect = element.getBoundingClientRect()
      dragBoundsRef.current = {
        minX: leftInset + margin - elementRect.left,
        maxX: window.innerWidth - rightInset - margin - elementRect.right,
        minY: topInset + margin - elementRect.top,
        maxY: window.innerHeight - bottomInset - margin - elementRect.bottom,
      }

      // capture so we keep getting events even if pointer leaves the element
      element.setPointerCapture(e.pointerId)
    },
    [position, topInset, rightInset, bottomInset, leftInset, margin],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current)
      return

    const dx = e.clientX - startPointerRef.current.x
    const dy = e.clientY - startPointerRef.current.y

    const clampedDx = Math.min(
      Math.max(dx, dragBoundsRef.current.minX),
      dragBoundsRef.current.maxX,
    )
    const clampedDy = Math.min(
      Math.max(dy, dragBoundsRef.current.minY),
      dragBoundsRef.current.maxY,
    )

    setPosition({
      x: startPositionRef.current.x + clampedDx,
      y: startPositionRef.current.y + clampedDy,
    })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    draggingRef.current = false
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }, [])

  const style: React.CSSProperties = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    cursor: draggingRef.current ? 'grabbing' : 'grab',
    // prevent text-selection while dragging
    userSelect: 'none',
    touchAction: 'none',
  }

  return { style, onPointerDown, onPointerMove, onPointerUp }
}
