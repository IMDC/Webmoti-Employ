import { SignIn } from '@clerk/clerk-react'
import { Center } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <Center h="100vh">
      <SignIn fallbackRedirectUrl="/" />
    </Center>
  )
}
