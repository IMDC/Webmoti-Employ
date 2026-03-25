import { Button, Card, Center, Stack, Text, Title, Transition } from '@mantine/core'
import { useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Loading } from '@/components/Loading'
import { googleSignIn } from '@/lib/auth-client'
import { clearUrlParam, notifyError } from '@/utils/utils'
import GoogleSignInImg from './web_dark_rd_ctn.svg'

const underscoreRegex = /_/g

export function SignInPage() {
  const { redirectTo, error } = useSearch({ from: '/sign-in' })
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleGoogleLogin = async () => {
    setLoading(true)
    await googleSignIn(redirectTo)
  }

  // this checks for an error in the search params and if it finds it,
  // it removes it and triggers an error popup.
  // the errors are set by the better-auth callback as "?error=..."
  useEffect(() => {
    if (error) {
      const formatError = (msg: string) => msg.replace(underscoreRegex, ' ')
      notifyError('Error signing in', formatError(error))
      clearUrlParam('error')
    }
  }, [error])

  if (loading) {
    return <Loading />
  }

  return (
    <Center h="100vh">
      <Transition mounted={mounted} transition="fade-up" duration={400}>
        {styles => (
          <Card w={400} radius="lg" padding="xl" shadow="md" withBorder style={styles}>
            <Stack align="center" gap="lg">
              <Stack align="center" gap="xs">
                <Title size="xl" ta="center">
                  WebMoti-Employ
                </Title>
                <Text size="sm" c="dimmed" ta="center">
                  Sign in with your Google account to continue
                </Text>
              </Stack>
              <Button
                onClick={handleGoogleLogin}
                variant="default"
                size="md"
                radius="md"
                p={0}
                bg="none"
                bd="none"
              >
                <img
                  src={GoogleSignInImg}
                  alt="Continue with Google"
                  style={{ width: 180 }}
                />
              </Button>
            </Stack>
          </Card>
        )}
      </Transition>
    </Center>
  )
}
