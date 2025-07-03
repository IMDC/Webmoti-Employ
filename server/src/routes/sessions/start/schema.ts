import { z } from "zod/v4";

export const StartSessionSchema = z.object({
  userIdentity: z.string().max(34),
});

export type StartSessionSchema = z.infer<typeof StartSessionSchema>;
