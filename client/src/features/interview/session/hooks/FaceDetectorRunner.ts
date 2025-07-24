import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'

export class FaceDetectorRunner {
  private detector: FaceDetector | null = null
  private rafId: number | null = null
  private lastVideoTime = -1
  private lastDetectTime = 0
  private videoEl: HTMLVideoElement
  private readonly minFrameInterval: number
  private isRunning = false

  constructor(videoEl: HTMLVideoElement, fps = 30) {
    this.videoEl = videoEl
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
    // only use the first detected face
    const faceBox = result.detections?.[0]?.boundingBox
    const videoRect = this.videoEl.getBoundingClientRect()

    const defaultBox = {
      x: videoRect.left,
      y: videoRect.top,
      width: videoRect.width,
      height: videoRect.height,
    }

    // if no face is found, the video rect is sent to electron
    const payload = {
      found: !!faceBox,
      boundingBox: faceBox
        ? {
            x: videoRect.left + faceBox.originX,
            y: videoRect.top + faceBox.originY,
            width: faceBox.width,
            height: faceBox.height,
          }
        : defaultBox,
    }

    window.electron.sendInterviewerCoordinates(payload)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.isRunning = false
  }
}
