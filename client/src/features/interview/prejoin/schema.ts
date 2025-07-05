import { z } from 'zod/v4';

export const InterviewDataSchema = z.object({
  sessionName: z.string(),
  token: z.string(),
});

export type InterviewData = z.infer<typeof InterviewDataSchema>;
