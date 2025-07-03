import { z } from "zod/v4";

export const JoinSessionSchema = z.object({
  userIdentity: z.string().max(34),
  sessionName: z.string().min(1).max(199),
});

export type StartSessionSchema = z.infer<typeof JoinSessionSchema>;
