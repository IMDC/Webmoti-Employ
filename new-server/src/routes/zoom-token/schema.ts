import { z } from "zod";

// https://developers.zoom.us/docs/video-sdk/auth/#payload
export const zoomTokenSchema = z.object({
  sessionName: z.string().min(1).max(199),
  role: z.coerce.number().refine((v) => v === 0 || v === 1),
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
    .refine(
      (val) => {
        if (!val) return true;
        const allowed = [
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
        const regions = val.split(",").map((r) => r.trim());
        return regions.every((r) => allowed.includes(r));
      },
      {
        message: "Invalid geoRegions value(s)",
      }
    ),
  cloudRecordingOption: z.coerce
    .number()
    .optional()
    .refine((v) => v === 0 || v === 1),
  cloudRecordingElection: z.coerce
    .number()
    .optional()
    .refine((v) => v === 0 || v === 1),
  telemetryTrackingId: z.string().optional(),
  videoWebRtcMode: z.coerce
    .number()
    .optional()
    .refine((v) => v === 0 || v === 1),
  audioWebRtcMode: z.coerce
    .number()
    .optional()
    .refine((v) => v === 0 || v === 1),
});

export type ZoomTokenInput = z.infer<typeof zoomTokenSchema>;
