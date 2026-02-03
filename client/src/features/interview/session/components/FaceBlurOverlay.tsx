import { useEffect, useRef } from 'react'

const MAX_BLUR = 75 // maximum blur when not looking
const BLUR_INCREASE_RATE = 20 // px/sec blur increase when not looking
const BLUR_DECREASE_RATE = MAX_BLUR // px/sec blur decrease when looking
const TARGET_RADIUS = 150 // circle radius when fully blurred
const START_RADIUS = TARGET_RADIUS * 2 // initial circle radius
const CIRCLE_GROW_RATE
  = ((START_RADIUS - TARGET_RADIUS) * BLUR_DECREASE_RATE) / MAX_BLUR // px/sec grow when looking
const FEATHER = 75 // px, controls softness of the circle edge

interface FaceBlurOverlayProps {
  faceDetectionResult?: InterviewerCoordinates | null
  isLookingAtInterviewer?: boolean
}

export function FaceBlurOverlay({
  faceDetectionResult,
  isLookingAtInterviewer,
}: FaceBlurOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const blurRef = useRef(0)
  const radiusRef = useRef(START_RADIUS)
  const lastTimeRef = useRef(performance.now())
  const lookingRef = useRef(isLookingAtInterviewer ?? false)

  const rafIdRef = useRef<number | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    lookingRef.current = isLookingAtInterviewer ?? false
  }, [isLookingAtInterviewer])

  useEffect(() => {
    cancelledRef.current = false

    const animate = (time: number) => {
      if (cancelledRef.current)
        return

      const dt = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time

      if (lookingRef.current) {
        // looking: fast unblur and grow back
        blurRef.current -= BLUR_DECREASE_RATE * dt
        radiusRef.current += CIRCLE_GROW_RATE * dt
        radiusRef.current = Math.min(START_RADIUS, radiusRef.current)
      }
      else {
        // not looking: increase blur
        blurRef.current += BLUR_INCREASE_RATE * dt
        blurRef.current = Math.min(MAX_BLUR, blurRef.current)

        // shrink radius proportionally to blur
        const blurRatio = blurRef.current / MAX_BLUR
        radiusRef.current = START_RADIUS - blurRatio * (START_RADIUS - TARGET_RADIUS)
      }

      // clamp blur
      blurRef.current = Math.max(0, blurRef.current)

      // update overlay mask
      const overlay = overlayRef.current
      if (overlay) {
        const { boundingBox } = faceDetectionResult || {}
        const { width: overlayW, height: overlayH } = overlay.getBoundingClientRect()

        const cx = boundingBox
          ? boundingBox.x * overlayW + (boundingBox.width * overlayW) / 2
          : overlayW / 2
        const cy = boundingBox
          ? boundingBox.y * overlayH + (boundingBox.height * overlayH) / 2
          : overlayH / 2

        const mask = `
          radial-gradient(
            circle at ${cx}px ${cy}px,
            transparent ${radiusRef.current}px,
            black ${radiusRef.current + FEATHER}px
          )
        `
        overlay.style.maskImage = mask
        overlay.style.backdropFilter = `blur(${blurRef.current}px)`
      }

      rafIdRef.current = requestAnimationFrame(animate)
    }

    lastTimeRef.current = performance.now()
    rafIdRef.current = requestAnimationFrame(animate)

    return () => {
      cancelledRef.current = true
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [faceDetectionResult])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
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
    </div>
  )
}
