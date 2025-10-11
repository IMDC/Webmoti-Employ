import { createFileRoute, redirect } from '@tanstack/react-router'
import z from 'zod'
import { getLocalBearerToken } from '@/utils/utils'
import { SignInPage } from '../features/auth/SignInPage'

export const Route = createFileRoute('/sign-in')({
  beforeLoad: async () => {
    // if already logged in, redirect to dashboard
    const token = getLocalBearerToken()
    if (token) {
      throw redirect({ to: '/' })
    }
  },
  component: SignInPage,
  validateSearch: z.object({
    redirectTo: z.string().optional(),
    error: z.string().optional(),
  }),
})
