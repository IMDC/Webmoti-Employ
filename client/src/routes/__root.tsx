import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ErrorDialog } from '@/components/ErrorDialog';

export const Route = createRootRoute({
  component: RootRoute,
});

function RootRoute() {
  return (
    <>
      <Outlet />
      <ErrorDialog />
    </>
  );
}
