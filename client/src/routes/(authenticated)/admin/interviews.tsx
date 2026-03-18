import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { InterviewsPage } from '@/features/admin/components/InterviewsPage'

export const Route = createFileRoute('/(authenticated)/admin/interviews')({
  component: InterviewsPage,
  validateSearch: z.object({
    highlight: z.number().optional(),
  }),
})
