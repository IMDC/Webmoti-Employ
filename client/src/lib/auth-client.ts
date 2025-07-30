import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/auth`,
})

export const {
  useSession,
  signIn,
  signOut,
} = authClient

export type Session = typeof authClient.$Infer.Session
export type User = typeof authClient.$Infer.Session.user
