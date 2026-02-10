import { createAuthClient } from 'better-auth/react'
import {
  getLocalBearerToken,
  isElectron,
  notifyError,
  removeLocalBearerToken,
} from '@/utils/utils'

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

// Electron sign-in flow:
// 1. In Electron, press "Sign In"
// 2. Browser opens /auth/electron
// 3. Redirected to Google OAuth
// 4. Complete Google OAuth
// 5. Redirected back to /auth/electron with token in URL
// 6. /auth/electron redirects Electron app using a custom protocol along with the token
// 7. Electron app loads the home page with token in the URL, similar to the web app
// 8. Home page detects the token, clears it, and user is signed in

// note that this is not the most secure approach.
// Possible improvements (like how VSCode does it):
// 1. Host the /auth/electron page from electron using a local server
// 2. Don't send token from browser to electron, instead use the backend server and a single use nonce
// 3. Don't have the token in the URL at all (But this is an issue with the better-auth library)

export async function electronGoogleSignIn() {
  const clientBase = window.location.origin
  const callbackURL = `${clientBase}/auth/electron`

  await authClient.signIn.social(
    { provider: 'google', callbackURL, errorCallbackURL: callbackURL },
    { onError: error => notifyError('Failed to sign in', error) },
  )
}

export async function googleSignIn(redirectTo: string | undefined) {
  const clientBase = window.location.origin

  // if on electron and pressing sign in, it should redirect to the users external browser.
  // the /auth/electron page is a hosted page that completes OAuth and redirects back to electron after.
  if (isElectron()) {
    const electronSignInUrl = `${clientBase}/auth/electron`
    window.electron.openExternalUrl(electronSignInUrl)
    return
  }

  // redirectTo is not always set
  const callbackURL = redirectTo ? `${clientBase}${redirectTo}` : clientBase
  const errorCallbackURL = `${clientBase}/sign-in${redirectTo ? `?redirectTo=${redirectTo}` : ''}`

  await authClient.signIn.social(
    { provider: 'google', callbackURL, errorCallbackURL },
    { onError: error => notifyError('Failed to sign in', error) },
  )
}

export async function signOut() {
  await authClient.signOut()
  removeLocalBearerToken()
}

export const { useSession } = authClient

export type Session = typeof authClient.$Infer.Session
export type User = typeof authClient.$Infer.Session.user
