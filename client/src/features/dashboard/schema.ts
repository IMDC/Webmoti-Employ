import { z } from 'zod/v4';

// ----------------------------------------------------------------
// GET /interviews

const InterviewInvite = z.object({
  id: z.number(),
  interviewId: z.number(),
  email: z.email(),
});

export type InterviewInvite = z.infer<typeof InterviewInvite>;

export const Interview = z.object({
  id: z.number(),
  creatorId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  invites: z.array(InterviewInvite).optional(),
  sessionId: z.uuidv4(),
});

export const InterviewsGetResponse = z.object({
  interviews: z.array(Interview),
});

export type Interview = z.infer<typeof Interview>;

// ----------------------------------------------------------------
// POST /interviews

export const InterviewsPostRequest = z.object({
  creatorId: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  invites: z.array(z.object({ email: z.email() })),
});

export type InterviewsPostRequest = z.infer<typeof InterviewsPostRequest>;

// ----------------------------------------------------------------
// Interview form schema:

export const ScheduleInterviewForm = z.object({
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // ex: "09:00"
  invites: z.array(z.object({ email: z.email() })),
  openGoogleCalendar: z.boolean(),
});

export type ScheduleInterviewForm = z.infer<typeof ScheduleInterviewForm>;

// ----------------------------------------------------------------
// Join code schema:

export const JoinCodeInput = z.uuidv4();
