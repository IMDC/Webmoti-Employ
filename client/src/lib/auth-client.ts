import type { AppError } from '@/useAppStore'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/auth`,
  fetchOptions: {
    credentials: 'include',
  },
})

export const { useSession, signOut } = authClient

export async function googleSignIn(
  redirectTo: string | undefined,
  setError: (error: AppError | null) => void,
) {
  const base = window.location.origin
  // redirectTo is not always set
  const callbackURL = redirectTo ? `${base}${redirectTo}` : base
  const errorCallbackURL = `${base}/sign-in${redirectTo ? `?redirectTo=${redirectTo}` : ''}`

  await authClient.signIn.social(
    { provider: 'google', callbackURL, errorCallbackURL },
    { onError: error => setError({ message: 'Failed to sign in', details: error }) },
  )
}

export type Session = typeof authClient.$Infer.Session
export type User = typeof authClient.$Infer.Session.user
