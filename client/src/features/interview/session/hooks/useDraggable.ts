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
  const dragging = useRef(false)
  const startPointer = useRef<Position>({ x: 0, y: 0 })
  const startPosition = useRef<Position>({ x: 0, y: 0 })
  const dragBounds = useRef<DragBounds>({
    minX: Number.NEGATIVE_INFINITY,
    maxX: Number.POSITIVE_INFINITY,
    minY: Number.NEGATIVE_INFINITY,
    maxY: Number.POSITIVE_INFINITY,
  })

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true
      startPointer.current = { x: e.clientX, y: e.clientY }
      startPosition.current = { ...position }

      const element = e.currentTarget as HTMLElement
      const elementRect = element.getBoundingClientRect()
      dragBounds.current = {
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
    if (!dragging.current)
      return

    const dx = e.clientX - startPointer.current.x
    const dy = e.clientY - startPointer.current.y

    const clampedDx = Math.min(
      Math.max(dx, dragBounds.current.minX),
      dragBounds.current.maxX,
    )
    const clampedDy = Math.min(
      Math.max(dy, dragBounds.current.minY),
      dragBounds.current.maxY,
    )

    setPosition({
      x: startPosition.current.x + clampedDx,
      y: startPosition.current.y + clampedDy,
    })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }, [])

  const style: React.CSSProperties = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    cursor: dragging.current ? 'grabbing' : 'grab',
    // prevent text-selection while dragging
    userSelect: 'none',
    touchAction: 'none',
  }

  return { style, onPointerDown, onPointerMove, onPointerUp }
}
