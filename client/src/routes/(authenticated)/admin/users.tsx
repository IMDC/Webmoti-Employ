import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { UsersPage } from '@/features/admin/components/UsersPage'

const usersSearchSchema = z.object({
  highlight: z.string().optional(),
})

export const Route = createFileRoute('/(authenticated)/admin/users')({
  component: UsersPage,
  validateSearch: usersSearchSchema,
})
