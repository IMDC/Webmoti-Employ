import type { AppError } from '@/useAppStore'
import { createAuthClient } from 'better-auth/react'
import { getLocalBearerToken, removeLocalBearerToken } from '@/utils/utils'

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/auth`,
  fetchOptions: {
    // include token in all requests
    auth: {
      type: 'Bearer',
      token: () => getLocalBearerToken() || '',
    },
    // don't send cookies since we're using bearer token instead
    credentials: 'omit',
  },
})

export async function googleSignIn(
  redirectTo: string | undefined,
  setError: (error: AppError | null) => void,
) {
  const clientBase = window.location.origin
  // redirectTo is not always set
  const callbackURL = redirectTo ? `${clientBase}${redirectTo}` : clientBase
  const errorCallbackURL = `${clientBase}/sign-in${redirectTo ? `?redirectTo=${redirectTo}` : ''}`

  await authClient.signIn.social(
    { provider: 'google', callbackURL, errorCallbackURL },
    { onError: error => setError({ message: 'Failed to sign in', details: error }) },
  )
}

export async function signOut() {
  await authClient.signOut()
  removeLocalBearerToken()
}

export const { useSession } = authClient

export type Session = typeof authClient.$Infer.Session
export type User = typeof authClient.$Infer.Session.user
