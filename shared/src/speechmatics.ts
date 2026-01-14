import z from 'zod'

export const SpeechmaticsResponse = z.object({ key: z.string() })
export type SpeechmaticsResponse = z.infer<typeof SpeechmaticsResponse>
