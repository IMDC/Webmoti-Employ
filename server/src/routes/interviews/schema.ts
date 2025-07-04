import { z } from "zod/v4";

export const interviewPostSchema = z.object({
  creatorId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  invites: z.array(z.email()).optional(),
});

export const interviewDeleteSchema = z.object({ id: z.number() });
