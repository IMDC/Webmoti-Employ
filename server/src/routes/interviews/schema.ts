import { z } from 'zod/v4';

const InterviewInvite = z.object({
  email: z.email(),
});

export type InterviewInvite = z.infer<typeof InterviewInvite>;

export const InterviewsPostRequest = z.object({
  creatorId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  invites: z.array(InterviewInvite).optional(),
});

export const InterviewsDeleteRequest = z.object({ id: z.number() });
