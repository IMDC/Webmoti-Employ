/* eslint-disable ts/no-redeclare */
import { z } from 'zod'

export const SessionsGetResponse = z.object({
  sessionId: z.uuidv4(),
  token: z.jwt(),
})

export type SessionsGetResponse = z.infer<typeof SessionsGetResponse>
