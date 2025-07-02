import { SignIn } from '@clerk/clerk-react';
import { createFileRoute } from '@tanstack/react-router';
import { Center } from '@mantine/core';

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  return (
    <Center h="100vh">
      <SignIn fallbackRedirectUrl="/" />
    </Center>
  );
}
