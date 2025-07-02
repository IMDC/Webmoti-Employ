import { z } from 'zod/v4';

const InterviewInviteSchema = z.object({
  id: z.number(),
  interviewId: z.number(),
  email: z.email(),
});

export const InterviewSchema = z.object({
  id: z.number(),
  creatorId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  invites: z.array(InterviewInviteSchema).optional(),
});

export const InterviewsResponseSchema = z.object({
  interviews: z.array(InterviewSchema),
});

export type Interview = z.infer<typeof InterviewSchema>;
