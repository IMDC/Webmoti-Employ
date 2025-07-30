import { createFileRoute, Outlet, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Loading } from '@/components/Loading'
import { SettingsMenu } from '@/components/SettingsMenu'
import { UserContextProvider } from '@/features/auth/components/UserContextProvider'
import { useSession } from '@/lib/auth-client'

export const Route = createFileRoute('/(authenticated)')({
  component: AuthedLayout,
})

function AuthedLayout() {
  const { data, isPending } = useSession()
  const navigate = useNavigate()
  const router = useRouter()
  const currentPath = router.state.location.pathname

  // redirect to sign-in if no user
  useEffect(() => {
    if (!isPending && !data?.user) {
      navigate({ to: '/sign-in', search: { redirectTo: currentPath } })
    }
  }, [isPending, data?.user, navigate, currentPath])

  if (isPending) {
    return <Loading />
  }

  if (!data?.user)
    return null

  return (
    <UserContextProvider session={data}>
      <Outlet />
      <SettingsMenu />
    </UserContextProvider>
  )
}
