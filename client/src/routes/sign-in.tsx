import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import { SignInPage } from '../features/auth/SignInPage'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
  validateSearch: z.object({
    redirectTo: z.string().optional(),
    error: z.string().optional(),
  }),
})
