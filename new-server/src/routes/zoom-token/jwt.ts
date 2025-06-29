import { SignJWT } from "jose";
import { toStringArray } from "./utils";

export type ZoomJwtInput = {
  zoomVideoSdkKey: string;
  role: number;
  sessionName: string;
  expirationSeconds?: number;
  userIdentity?: string;
  sessionKey?: string;
  geoRegions?: string[] | string;
  cloudRecordingOption?: number;
  cloudRecordingElection?: number;
  telemetryTrackingId?: string;
  videoWebRtcMode?: number;
  audioCompatibleMode?: number;
  audioWebRtcMode?: number;
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
  audioCompatibleMode,
  audioWebRtcMode,
}: ZoomJwtInput) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = expirationSeconds ? iat + expirationSeconds : iat + 60 * 60 * 2;

  const joinGeoRegions = (geoRegions: unknown) =>
    toStringArray(geoRegions)?.join(",");

  const payload = {
    app_key: zoomVideoSdkKey,
    role_type: role,
    tpc: sessionName,
    version: 1,
    iat,
    exp,
    user_identity: userIdentity,
    session_key: sessionKey,
    geo_regions: joinGeoRegions(geoRegions),
    cloud_recording_option: cloudRecordingOption,
    cloud_recording_election: cloudRecordingElection,
    telemetry_tracking_id: telemetryTrackingId,
    video_webrtc_mode: videoWebRtcMode,
    audio_webrtc_mode: audioWebRtcMode ?? audioCompatibleMode,
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
