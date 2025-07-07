import { z } from 'zod/v4';

const InterviewInviteSchema = z.object({
  email: z.email(),
});

export type InterviewInvite = z.infer<typeof InterviewInviteSchema>;

export const InterviewPostSchema = z.object({
  creatorId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  invites: z.array(InterviewInviteSchema).optional(),
});

export const InterviewDeleteSchema = z.object({ id: z.number() });
