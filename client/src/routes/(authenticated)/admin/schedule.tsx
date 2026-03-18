import { createFileRoute } from '@tanstack/react-router'
import { AdminSchedulePage } from '@/features/admin/components/AdminSchedulePage'

export const Route = createFileRoute('/(authenticated)/admin/schedule')({
  component: AdminSchedulePage,
})
