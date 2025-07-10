import { z } from 'zod/v4';

export const InterviewsDeleteRequest = z.object({ id: z.number() });
