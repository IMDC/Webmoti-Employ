import { createFileRoute } from '@tanstack/react-router'
import { InterviewsPage } from '@/features/admin/components/InterviewsPage'

export const Route = createFileRoute('/(authenticated)/admin/interviews')({
  component: InterviewsPage,
})
