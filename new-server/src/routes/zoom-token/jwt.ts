import { SignJWT } from "jose";
import { ZoomTokenInput } from "./schema";

export type ZoomJwtInput = ZoomTokenInput & {
  zoomVideoSdkKey: string;
};

export async function generateZoomJwt({
  zoomVideoSdkKey,
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
  const iat = Math.floor(Date.now() / 1000);
  const exp = expirationSeconds ? iat + expirationSeconds : iat + 60 * 60 * 2;

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
  };
  const header = { alg: "HS256", typ: "JWT" };
  const secret = new TextEncoder().encode(zoomVideoSdkKey);

  const jwt = await new SignJWT(payload)
    .setProtectedHeader(header)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(secret);

  return jwt;
}
