/* eslint-disable ts/no-redeclare */
import { z } from 'zod'

export const DbInterviewInvite = z.object({
  id: z.number(),
  interviewId: z.number(),
  email: z.email(),
  isInterviewer: z.boolean().default(false),
  isInterviewCreator: z.boolean().optional(), // server sets this, not client
})
export const NewInterviewInvite = DbInterviewInvite.omit({
  id: true,
  interviewId: true,
})

export const DbInterview = z.object({
  id: z.number(),
  creatorId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  invites: z.array(DbInterviewInvite).optional(),
  sessionId: z.uuidv4(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export const NewInterview = DbInterview.omit({
  id: true,
  sessionId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  invites: z.array(NewInterviewInvite).optional(),
})

export const InterviewRole = z.enum(['creator', 'interviewer', 'interviewee'])
export const InterviewInviteResponse = DbInterviewInvite.extend({
  isYou: z.boolean().optional(),
})
export const InterviewResponse = DbInterview.extend({
  invites: z.array(InterviewInviteResponse),
  yourRole: InterviewRole,
})

export type DbInterview = z.infer<typeof DbInterview>
export type NewInterview = z.infer<typeof NewInterview>
export type DbInterviewInvite = z.infer<typeof DbInterviewInvite>
export type NewInterviewInvite = z.infer<typeof NewInterviewInvite>
export type InterviewResponse = z.infer<typeof InterviewResponse>
export type InterviewInviteResponse = z.infer<typeof InterviewInviteResponse>
export type InterviewRole = z.infer<typeof InterviewRole>
