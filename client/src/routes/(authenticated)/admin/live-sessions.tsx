import { createFileRoute } from '@tanstack/react-router'
import { LiveSessionsPage } from '@/features/admin/components/LiveSessionsPage'

export const Route = createFileRoute('/(authenticated)/admin/live-sessions')({
  component: LiveSessionsPage,
})
