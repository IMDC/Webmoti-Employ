import { z } from 'zod/v4';

export const SessionsGetResponse = z.object({
  sessionId: z.uuidv4(),
  token: z.jwt(),
});

export type SessionsGetResponse = z.infer<typeof SessionsGetResponse>;
