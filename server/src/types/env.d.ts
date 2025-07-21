// this is for running "typecheck" in ci
declare namespace Cloudflare {
  interface Env {
    ZOOM_VIDEO_SDK_KEY: string
    ZOOM_VIDEO_SDK_SECRET: string
    ZOOM_API_KEY: string
    ZOOM_API_SECRET: string
    CLERK_SECRET_KEY: string
    CLERK_PUBLISHABLE_KEY: string
    DATABASE_URL: string
    CORS_ORIGIN: string
    RATE_LIMITER: RateLimit
    HYPERDRIVE: Hyperdrive
  }
}
