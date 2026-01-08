import { Button, Center, Image, Stack, Text } from '@mantine/core'
import { IconExclamationCircle } from '@tabler/icons-react'
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import z from 'zod'
import { Loading } from '@/components/Loading'
import { electronGoogleSignIn } from '@/lib/auth-client'
import { useAppActions } from '@/useAppStore'
import { ELECTRON_PROTOCOL_SCHEME } from '@/utils/constants'
import { clearUrlParam, getUrlAuthToken } from '@/utils/utils'

export const Route = createFileRoute('/auth/electron')({
  component: ElectronAuthPage,
  validateSearch: z.object({
    error: z.string().optional(),
  }),
})

function ElectronAuthPage() {
  const { error } = useSearch({ from: '/auth/electron' })
  const { setError } = useAppActions()
  const [loading, setLoading] = useState(false)

  const [hasToken, setHasToken] = useState(false)
  const effectRan = useRef(false)

  useEffect(() => {
    // prevent the useEffect from running after already signing in to avoid infinite sign in
    if (effectRan.current)
      return
    effectRan.current = true

    // because of a bug in the better-auth library, we pass the bearer token in the redirect url
    // (instead of in the headers)
    const authToken = getUrlAuthToken()
    if (authToken) {
      // don't set the local bearer token here so the web app isn't signed in as well
      clearUrlParam('authToken')
      setHasToken(true)

      const electronLink = `${ELECTRON_PROTOCOL_SCHEME}://auth?authToken=${encodeURIComponent(authToken)}`
      // redirect to electron app
      window.location.replace(electronLink)
      return
    }

    if (error) {
      return
    }

    // if token not found, it means the page just loaded for the first time, so need to sign in.
    electronGoogleSignIn(setError)
  }, [setError, error])

  if (error) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <IconExclamationCircle size={100} />
          <Text fz="h2" fw="bold">{`Error signing in: ${error.replace(/_/g, ' ')}`}</Text>
          <Button
            variant="gradient"
            onClick={() => {
              setLoading(true)
              electronGoogleSignIn(setError)
            }}
            loading={loading}
          >
            Try Again
          </Button>
        </Stack>
      </Center>
    )
  }

  if (!hasToken) {
    return <Loading />
  }

  return (
    <Center h="100vh">
      <Stack align="center">
        <Image
          src="/favicon.svg"
          height={125}
          fit="contain"
          style={{
            filter: 'drop-shadow(0 0 35px rgba(0, 120, 255, 0.4))',
          }}
          mb="xl"
        />

        <Text fz="h1" fw="bold">Launching WebMoti-Employ</Text>
        <Text fw="lighter">You will be redirected in a few moments.</Text>
      </Stack>
    </Center>
  )
}
