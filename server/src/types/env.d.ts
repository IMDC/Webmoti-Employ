// this is for running "typecheck" in ci
declare namespace Cloudflare {
  interface Env {
    CORS_ORIGIN: string
    ZOOM_VIDEO_SDK_KEY: string
    ZOOM_VIDEO_SDK_SECRET: string
    ZOOM_API_KEY: string
    ZOOM_API_SECRET: string
  }
}
