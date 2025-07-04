import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/(authenticated)/interview/prejoin/')({
  beforeLoad: () => {
    throw redirect({ to: '/interview/prejoin/create' });
  },
});
