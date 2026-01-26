import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'

export type FaceDetectionCallback = (data: InterviewerCoordinates) => void

export class FaceDetectorRunner {
  private detector: FaceDetector | null = null
  private rafId: number | null = null
  private lastVideoTime = -1
  private lastDetectTime = 0
  private videoEl: HTMLVideoElement
  private readonly minFrameInterval: number
  private isRunning = false
  private callback: FaceDetectionCallback

  constructor(videoEl: HTMLVideoElement, callback: FaceDetectionCallback, fps = 30) {
    this.videoEl = videoEl
    this.callback = callback
    this.minFrameInterval = 1000 / fps
  }

  async init() {
    if (this.isRunning)
      return
    this.isRunning = true

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
    )
    const modelBuffer = new Uint8Array(await window.electron.getModelBuffer())

    this.detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetBuffer: modelBuffer,
        delegate: 'GPU',
      },
      minDetectionConfidence: 0.7,
      runningMode: 'VIDEO',
    })

    this.loop()
  }

  private loop = () => {
    if (!this.detector)
      return

    const videoTime = this.videoEl.currentTime
    const now = performance.now()

    // Run detection only if:
    // 1. the video is on a new frame
    // 2. enough time has passed (FPS throttle)
    if (
      videoTime !== this.lastVideoTime
      && now - this.lastDetectTime >= this.minFrameInterval
    ) {
      this.lastVideoTime = videoTime
      this.lastDetectTime = now
      this.runDetection()
    }

    this.rafId = requestAnimationFrame(this.loop)
  }

  private runDetection() {
    const now = performance.now()
    const result = this.detector!.detectForVideo(this.videoEl, now)
    const faceBox = result.detections?.[0]?.boundingBox
    const videoRect = this.videoEl.getBoundingClientRect()

    const videoWidth = this.videoEl.videoWidth
    const videoHeight = this.videoEl.videoHeight

    const scaleX = videoRect.width / videoWidth
    const scaleY = videoRect.height / videoHeight

    // Convert element rect to screen pixel coords (account for window position)
    const winOffsetX = window.screenX || 0
    const winOffsetY = window.screenY || 0
    const rectLeftScreen = winOffsetX + videoRect.left
    const rectTopScreen = winOffsetY + videoRect.top

    const toScreenBox = () => ({
      x: rectLeftScreen,
      y: rectTopScreen,
      width: videoRect.width,
      height: videoRect.height,
    })

    const screenBox = faceBox
      ? (() => {
          const rawX = rectLeftScreen + faceBox.originX * scaleX
          const rawY = rectTopScreen + faceBox.originY * scaleY
          const rawW = faceBox.width * scaleX
          const rawH = faceBox.height * scaleY

          const heightScale = 1.4
          const extraH = rawH * (heightScale - 1)
          const expandedY = rawY - extraH / 2
          const expandedH = rawH + extraH

          const widthScale = 1.2
          const extraW = rawW * (widthScale - 1)
          const expandedX = rawX - extraW / 2
          const expandedW = rawW + extraW

          return {
            x: expandedX,
            y: expandedY,
            width: expandedW,
            height: expandedH,
          }
        })()
      : toScreenBox()

    // Normalize to screen [0,1] coordinates to match Tobii on_display_area
    const screenW = window.screen.width
    const screenH = window.screen.height
    const norm = {
      x: screenBox.x / screenW,
      y: screenBox.y / screenH,
      width: screenBox.width / screenW,
      height: screenBox.height / screenH,
    }

    this.callback({ found: !!faceBox, boundingBox: norm })
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.isRunning = false
  }
}
