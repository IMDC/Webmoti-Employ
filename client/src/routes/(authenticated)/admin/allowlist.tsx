import { createFileRoute } from '@tanstack/react-router'
import { AllowlistPage } from '@/features/admin/components/AllowlistPage'

export const Route = createFileRoute('/(authenticated)/admin/allowlist')({
  component: AllowlistPage,
})
