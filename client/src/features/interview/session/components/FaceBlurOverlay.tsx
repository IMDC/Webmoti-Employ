import { useEffect, useRef } from 'react'

interface FaceBlurOverlayProps {
  blurPx?: number
  faceBox?: { x: number, y: number, w: number, h: number }
  active?: boolean
}

export function FaceBlurOverlay({ blurPx = 8, faceBox, active = true }: FaceBlurOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || !active)
      return

    // fallback mask if no faceBox provided
    const cx = faceBox ? faceBox.x + faceBox.w / 2 : overlay.clientWidth / 2
    const cy = faceBox ? faceBox.y + faceBox.h / 2 : overlay.clientHeight / 2
    const r = faceBox ? Math.max(faceBox.w, faceBox.h) / 2 : 50

    const mask = `
      radial-gradient(
        circle at ${cx}px ${cy}px,
        rgba(0,0,0,0) ${r}px,
        rgba(0,0,0,1) ${r + 1}px
      )
    `

    overlay.style.maskImage = mask
    overlay.style.backdropFilter = `blur(${blurPx}px)`
  }, [faceBox, blurPx, active])

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}
