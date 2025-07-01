import { z } from "zod/v4";

export const interviewPostSchema = z.object({
  creatorId: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  invites: z.array(z.email()).optional(),
});
