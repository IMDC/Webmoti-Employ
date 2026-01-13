import { createFileRoute, Outlet, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Loading } from '@/components/Loading'
import { SettingsMenu } from '@/components/SettingsMenu'
import { UserContextProvider } from '@/features/auth/components/UserContextProvider'
import { useSession } from '@/lib/auth-client'
import {
  clearUrlParam,
  getLocalBearerToken,
  getUrlAuthToken,
  removeLocalBearerToken,
  setLocalBearerToken,
  showErrorNotification,
} from '@/utils/utils'

export const Route = createFileRoute('/(authenticated)')({
  component: AuthedLayout,
})

function AuthedLayout() {
  const { data, isPending } = useSession()
  const navigate = useNavigate()
  const router = useRouter()
  const currentPath = router.state.location.pathname

  useEffect(() => {
  // because of a bug in the better-auth library, we pass the bearer token in the redirect url
  // (instead of in the headers)
    const authToken = getUrlAuthToken()
    if (authToken) {
      setLocalBearerToken(authToken)
      clearUrlParam('authToken')
    }
  }, [])

  // redirect to sign-in if no user
  useEffect(() => {
    if (!isPending && !data?.user) {
      navigate({ to: '/sign-in', search: { redirectTo: currentPath } })
    }
  }, [isPending, data?.user, navigate, currentPath])

  if (isPending) {
    return <Loading />
  }

  if (!data?.user) {
    if (getLocalBearerToken()) {
      // no session but there is a token
      // this means the sign in failed

      removeLocalBearerToken()

      showErrorNotification(
        'Error signing in',
        'Session not found, please try again',
      )
    }

    // no session and no token
    // this means the user probably just signed out
    // (just return null since redirect will happen)

    return null
  }

  return (
    <UserContextProvider session={data}>
      <Outlet />
      <SettingsMenu />
    </UserContextProvider>
  )
}
