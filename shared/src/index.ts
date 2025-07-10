/* eslint-disable ts/no-redeclare */
import { z } from 'zod/v4'

export const InterviewInvite = z.object({
  id: z.number(),
  interviewId: z.number(),
  email: z.email(),
})
export const NewInterviewInvite = InterviewInvite.omit({
  id: true,
  interviewId: true,
})

export const Interview = z.object({
  id: z.number(),
  creatorId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  invites: z.array(InterviewInvite).optional(),
  sessionId: z.uuidv4(),
})
export const NewInterview = Interview.omit({
  id: true,
  sessionId: true,
})

export type Interview = z.infer<typeof Interview>
export type NewInterview = z.infer<typeof NewInterview>
export type InterviewInvite = z.infer<typeof InterviewInvite>
export type NewInterviewInvite = z.infer<typeof NewInterviewInvite>
