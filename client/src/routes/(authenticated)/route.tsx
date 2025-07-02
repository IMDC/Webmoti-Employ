import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/(authenticated)')({
  component: () => <AuthedLayout />,
});

function AuthedLayout() {
  return (
    <>
      <SignedIn>
        <Outlet />
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
