import { z } from 'zod/v4';

export const SessionsGetResponse = z.object({
  sessionName: z.string(),
  token: z.string(),
});

export type SessionsGetResponse = z.infer<typeof SessionsGetResponse>;
