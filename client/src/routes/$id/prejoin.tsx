import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/$id/prejoin')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$id/prejoin"!</div>;
}
