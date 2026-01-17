import { useEffect, useRef } from 'react'

interface FaceBlurOverlayProps {
  blurPx?: number
  active?: boolean
  faceDetectionResult?: InterviewerCoordinates | null
}

export function FaceBlurOverlay({
  blurPx = 8,
  active = true,
  faceDetectionResult,
}: FaceBlurOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || !active)
      return

    const { boundingBox } = faceDetectionResult || {}
    const { width: overlayW, height: overlayH } = overlay.getBoundingClientRect()

    // fallback center if no detection
    const cx = boundingBox ? boundingBox.x * overlayW + (boundingBox.width * overlayW) / 2 : overlayW / 2
    const cy = boundingBox ? boundingBox.y * overlayH + (boundingBox.height * overlayH) / 2 : overlayH / 2
    const r = boundingBox ? Math.max(boundingBox.width * overlayW, boundingBox.height * overlayH) / 2 : 50

    const mask = `
      radial-gradient(
        circle at ${cx}px ${cy}px,
        rgba(0,0,0,0) ${r}px,
        rgba(0,0,0,1) ${r + 1}px
      )
    `

    overlay.style.maskImage = mask
    overlay.style.backdropFilter = `blur(${blurPx}px)`
  }, [faceDetectionResult, blurPx, active])

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
