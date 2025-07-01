import { z } from 'zod/v4';

const InterviewInvite = z.object({
  id: z.number(),
  interviewId: z.number(),
  email: z.email(),
});

export const Interview = z.object({
  id: z.number(),
  creatorId: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  invites: z.array(InterviewInvite),
});

export type Interview = z.infer<typeof Interview>;
