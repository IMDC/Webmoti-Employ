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
  // extract the bearer token from the URL before the component mounts,
  // so it's available to useSession() on the first render
  beforeLoad: () => {
    const authToken = getUrlAuthToken()
    if (authToken) {
      setLocalBearerToken(authToken)
      clearUrlParam('authToken')
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { data, isPending } = useSession()
  const navigate = useNavigate()
  const router = useRouter()
  const currentPath = router.state.location.pathname

  // redirect to sign-in if no user
  useEffect(() => {
    if (isPending)
      return

    if (!data?.user) {
      if (getLocalBearerToken()) {
        // no session but there is a token, the sign in failed
        removeLocalBearerToken()
        showErrorNotification(
          'Error signing in',
          'Session not found, please try again',
        )
      }
      navigate({ to: '/sign-in', search: { redirectTo: currentPath } })
    }
  }, [isPending, data?.user, navigate, currentPath])

  if (isPending || !data?.user) {
    return <Loading />
  }

  return (
    <UserContextProvider session={data}>
      <Outlet />
      <SettingsMenu />
    </UserContextProvider>
  )
}
