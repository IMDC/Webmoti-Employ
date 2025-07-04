import { z } from 'zod/v4';

// ----------------------------------------------------------------
// GET from interviews

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

// ----------------------------------------------------------------
// POST to interviews

export const InterviewCreateSchema = z.object({
  creatorId: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  invites: z.array(z.object({ email: z.email() })),
});

export type InterviewCreate = z.infer<typeof InterviewCreateSchema>;

// ----------------------------------------------------------------
// Interview form schema:

export const ScheduleInterviewSchema = z.object({
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // ex: "09:00"
  invites: z.array(z.object({ email: z.email() })),
  openGoogleCalendar: z.boolean(),
});

export type ScheduleInterview = z.infer<typeof ScheduleInterviewSchema>;
