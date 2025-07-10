import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(authenticated)/interview/')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
})
