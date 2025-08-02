import type { AppError } from '@/useAppStore'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/auth`,
  // fetchOptions: {
  //   // include token in all requests
  //   auth: {
  //     type: 'Bearer',
  //     token: () => localStorage.getItem('bearer_token') || '',
  //   },

  //   // TODO:
  //   // set token when available (this currently doesn't work since the header is missing (bug))
  //   onSuccess: (ctx) => {
  //     const authToken = ctx.response.headers.get('set-auth-token')
  //     // the token is only available when redirecting from the google oauth screen
  //     if (authToken) {
  //       localStorage.setItem('bearer_token', authToken)
  //     }
  //     else {
  //       logger.warn('Auth token header not found')
  //     }
  //   },
  // },
})

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

export async function signOut() {
  // localStorage.removeItem('bearer_token')
  await authClient.signOut()
}

export const { useSession } = authClient

export type Session = typeof authClient.$Infer.Session
export type User = typeof authClient.$Infer.Session.user
