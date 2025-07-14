import type { JWTPayload } from 'jose'
import type { ZoomToken } from './schema'
import { SignJWT } from 'jose'

export type ZoomJwtInput = ZoomToken & {
  zoomVideoSdkKey: string
  zoomVideoSdkSecret: string
}

async function generateJwt(payload: JWTPayload, secret: string, iat: number, exp: number) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedSecret = new TextEncoder().encode(secret)

  const jwt = await new SignJWT(payload)
    .setProtectedHeader(header)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(encodedSecret)

  return jwt
}

export async function generateZoomApiJwt(zoomApiKey: string, zoomApiSecret: string) {
  const iat = Math.floor(Date.now() / 1000)
  const expirationSeconds = 300 // 5 min
  const exp = iat + expirationSeconds

  const payload = {
    iss: zoomApiKey,
    iat,
    exp,
  }

  const jwt = await generateJwt(payload, zoomApiSecret, iat, exp)

  return jwt
}

export async function generateZoomVideoJwt({
  zoomVideoSdkKey,
  zoomVideoSdkSecret,
  role,
  sessionName,
  expirationSeconds,
  userIdentity,
  sessionKey,
  geoRegions,
  cloudRecordingOption,
  cloudRecordingElection,
  telemetryTrackingId,
  videoWebRtcMode,
  audioWebRtcMode,
}: ZoomJwtInput) {
  const iat = Math.floor(Date.now() / 1000)
  const exp = expirationSeconds ? iat + expirationSeconds : iat + 60 * 60 * 2

  // https://developers.zoom.us/docs/video-sdk/auth/#payload
  const payload = {
    app_key: zoomVideoSdkKey,
    role_type: role,
    tpc: sessionName,
    version: 1,
    iat,
    exp,
    user_identity: userIdentity,
    session_key: sessionKey,
    geo_regions: geoRegions,
    cloud_recording_option: cloudRecordingOption,
    cloud_recording_election: cloudRecordingElection,
    telemetry_tracking_id: telemetryTrackingId,
    video_webrtc_mode: videoWebRtcMode,
    audio_webrtc_mode: audioWebRtcMode,
  }

  const jwt = await generateJwt(payload, zoomVideoSdkSecret, iat, exp)

  return jwt
}
