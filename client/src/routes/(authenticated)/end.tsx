import { createFileRoute, redirect } from '@tanstack/react-router'
import { EndScreen } from '@/features/interview/end/EndScreen'

export const Route = createFileRoute('/(authenticated)/end')({
  beforeLoad: ({ location }) => {
    // if you didn't come from interview, then redirect to /
    if (location.state?.stage !== 'interview') {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: EndScreen,
})
