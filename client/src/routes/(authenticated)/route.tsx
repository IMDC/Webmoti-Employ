import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SettingsMenu } from '@/components/SettingsMenu'

export const Route = createFileRoute('/(authenticated)')({
  component: () => <AuthedLayout />,
})

function AuthedLayout() {
  return (
    <>
      <SignedIn>
        <Outlet />
        <SettingsMenu />
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
