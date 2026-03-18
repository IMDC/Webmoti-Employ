import { createFileRoute } from '@tanstack/react-router'
import { UsersPage } from '@/features/admin/components/UsersPage'

export const Route = createFileRoute('/(authenticated)/admin/users')({
  component: UsersPage,
})
