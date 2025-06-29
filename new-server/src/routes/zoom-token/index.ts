import { Hono } from "hono";
import { toStringArray } from "./utils";
import {
  inNumberArray,
  isBetween,
  isLengthLessThan,
  isRequired,
  matchesStringArray,
  validateRequest,
} from "./validations";
import { env } from "hono/adapter";

const zoomTokenRoute = new Hono();

// Validations should match Zoom Video SDK's documentation:
// https://developers.zoom.us/docs/video-sdk/auth/#payload
const validator = {
  role: [isRequired, inNumberArray([0, 1])],
  sessionName: [isRequired, isLengthLessThan(200)],
  expirationSeconds: isBetween(1800, 172800),
  userIdentity: isLengthLessThan(35),
  sessionKey: isLengthLessThan(36),
  geoRegions: matchesStringArray([
    "AU",
    "BR",
    "CA",
    "CN",
    "DE",
    "HK",
    "IN",
    "JP",
    "MX",
    "NL",
    "SG",
    "US",
  ]),
  cloudRecordingOption: inNumberArray([0, 1]),
  cloudRecordingElection: inNumberArray([0, 1]),
  videoWebRtcMode: inNumberArray([0, 1]),
  // Deprecated: See README for more information. Will be removed in the future.
  audioCompatibleMode: inNumberArray([0, 1]),
  audioWebRtcMode: inNumberArray([0, 1]),
};

const coerceRequestBody = (body: Record<string, unknown>) => ({
  ...body,
  ...[
    "role",
    "expirationSeconds",
    "cloudRecordingOption",
    "cloudRecordingElection",
    "videoWebRtcMode",
    "audioCompatibleMode",
    "audioWebRtcMode",
  ].reduce(
    (acc, cur) => ({
      ...acc,
      [cur]: typeof body[cur] === "string" ? parseInt(body[cur]) : body[cur],
    }),
    {}
  ),
});

zoomTokenRoute.post("/", async (c) => {
  const body = await c.req.json();

  const requestBody = coerceRequestBody(body);
  const validationErrors = validateRequest(requestBody, validator);

  if (validationErrors.length > 0) {
    return c.json({ errors: validationErrors }, 400);
  }

  // const {
  //   role,
  //   sessionName,
  //   expirationSeconds,
  //   userIdentity,
  //   sessionKey,
  //   geoRegions,
  //   cloudRecordingOption,
  //   cloudRecordingElection,
  //   telemetryTrackingId,
  //   videoWebRtcMode,
  //   audioCompatibleMode,
  //   audioWebRtcMode,
  // } = requestBody;

  // const { zoomVideoSdkKey } = env<{ ZOOM_VIDEO_SDK_KEY: string }>(c);

  return c.text("Hello Hono!");
});

export default zoomTokenRoute;
