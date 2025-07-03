import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/(authenticated)/interview/')({
  beforeLoad: () => {
    // you shouldn't navigate to this route directly, so redirect away
    throw redirect({ to: '/' });
  },
});
