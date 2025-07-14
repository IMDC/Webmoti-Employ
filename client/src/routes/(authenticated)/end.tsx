import { createFileRoute, redirect } from '@tanstack/react-router'
import { EndScreen } from '@/features/interview/end/EndScreen'

export const Route = createFileRoute('/(authenticated)/end')({
  beforeLoad: () => {
    const allowed = sessionStorage.getItem('fromInterview') === '1'
    // if you didn't come from interview, then redirect to /
    if (!allowed) {
      throw redirect({ to: '/', replace: true })
    }

    sessionStorage.removeItem('fromInterview')
  },
  component: EndScreen,
})
