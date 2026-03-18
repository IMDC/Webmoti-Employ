import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/(authenticated)/admin/')({
  component: () => <Navigate to="/admin/overview" />,
})
