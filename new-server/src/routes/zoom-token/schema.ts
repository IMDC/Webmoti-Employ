import { z } from "zod/v4";

const allowedRegions = [
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
];

// https://developers.zoom.us/docs/video-sdk/auth/#payload
export const zoomTokenSchema = z.object({
  sessionName: z.string().min(1).max(199),
  role: z.union([z.literal(0), z.literal(1)]),
  expirationSeconds: z.coerce
    .number()
    .optional()
    .refine((v) => v === undefined || (v >= 1800 && v <= 172800), {
      message: "Must be between 1800 and 172800",
    }),
  userIdentity: z.string().max(34).optional(),
  sessionKey: z.string().max(35).optional(),
  geoRegions: z
    .string()
    .optional()
    .transform((val) => val?.split(",").map((r) => r.trim()))
    .refine(
      (regions) =>
        regions === undefined ||
        regions.every((r) => allowedRegions.includes(r)),
      {
        message: "Invalid geoRegions value(s)",
      }
    ),
  cloudRecordingOption: z.union([z.literal(0), z.literal(1)]).optional(),
  cloudRecordingElection: z.union([z.literal(0), z.literal(1)]).optional(),
  telemetryTrackingId: z.string().optional(),
  videoWebRtcMode: z.union([z.literal(0), z.literal(1)]).optional(),
  audioWebRtcMode: z.union([z.literal(0), z.literal(1)]).optional(),
});

export type ZoomTokenInput = z.infer<typeof zoomTokenSchema>;
