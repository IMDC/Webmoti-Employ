import { createFileRoute, redirect } from '@tanstack/react-router';
import { Route as PrejoinRoute } from './prejoin';

export const Route = createFileRoute('/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: PrejoinRoute.to,
      params: { id: params.id },
    });
  },
});
