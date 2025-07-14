/* eslint-disable ts/no-redeclare */
import { InterviewResponse, NewInterviewInvite } from '@web-employ/shared'
import { z } from 'zod'

// ----------------------------------------------------------------
// GET /interviews

export const InterviewsGetResponse = z.object({
  interviews: z.array(InterviewResponse),
})

// ----------------------------------------------------------------
// Interview form schema:

// ! Note: zod4Resolver doesn't transform or coerce values
export const ScheduleInterviewForm = z.object({
  // since date is from datepicker, don't coerce date.
  // the time is set to midnight so it becomes the wrong day.
  date: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/), // ex: "09:00:00"
  invites: z.array(NewInterviewInvite),
  openGoogleCalendar: z.boolean(),
})

export type ScheduleInterviewForm = z.infer<typeof ScheduleInterviewForm>

// ----------------------------------------------------------------
// Interview post response:

export const InterviewsPostResponse = z.object({
  sessionId: z.uuidv4(),
})

// ----------------------------------------------------------------
// Join code schema:

export const JoinCodeInput = z.uuidv4()
