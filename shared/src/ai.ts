import { z } from 'zod'

export const TranscriptMessage = z.object({
  text: z.string(),
  status: z.enum(['final', 'partial']),
})

export const NotificationMessage = z.object({
  hint: z.array(z.string()).default([]),
  timer: z.number().nullable().default(null),
  fillerCount: z.number().default(0),
  isQuestionAnswered: z.boolean().default(false),
})

export const WebSocketMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('transcript'), payload: TranscriptMessage }),
  z.object({ type: z.literal('notification'), payload: NotificationMessage }),
  z.object({ type: z.literal('ping') }),
])

export type WebSocketMessage = z.infer<typeof WebSocketMessage>
export type TranscriptMessage = z.infer<typeof TranscriptMessage>
export type NotificationMessage = z.infer<typeof NotificationMessage>
