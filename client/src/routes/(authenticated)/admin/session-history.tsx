import { createFileRoute } from '@tanstack/react-router'
import { SessionHistoryPage } from '@/features/admin/components/SessionHistoryPage'

export const Route = createFileRoute('/(authenticated)/admin/session-history')({
  component: SessionHistoryPage,
})
