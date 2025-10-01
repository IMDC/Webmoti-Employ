import { z } from 'zod'

const TranscriptMessage = z.object({
  text: z.string(),
})

const NotificationMessage = z.object({
  'detail': z.optional(z.boolean()),
  'timer': z.optional(z.number()),
  'filler-count': z.optional(z.number()),
})

export const WebSocketMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('transcript'), payload: TranscriptMessage }),
  z.object({ type: z.literal('notification'), payload: NotificationMessage }),
])

export type WebSocketMessage = z.infer<typeof WebSocketMessage>
export type TranscriptMessage = z.infer<typeof TranscriptMessage>
export type NotificationMessage = z.infer<typeof NotificationMessage>
