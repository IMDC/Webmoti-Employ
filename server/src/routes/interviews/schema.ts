import { z } from 'zod'

export const InterviewsDeleteRequest = z.object({ id: z.number() })
