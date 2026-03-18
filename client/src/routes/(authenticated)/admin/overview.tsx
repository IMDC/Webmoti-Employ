import { createFileRoute } from '@tanstack/react-router'
import { OverviewPage } from '@/features/admin/components/OverviewPage'

export const Route = createFileRoute('/(authenticated)/admin/overview')({
  component: OverviewPage,
})
