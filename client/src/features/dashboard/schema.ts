import { Interview } from '@web-employ/shared';
import { z } from 'zod/v4';

// ----------------------------------------------------------------
// GET /interviews

export const InterviewsGetResponse = z.object({
  interviews: z.array(Interview),
});

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
