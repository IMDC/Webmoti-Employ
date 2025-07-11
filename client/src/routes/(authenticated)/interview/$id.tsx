import { createFileRoute, redirect } from '@tanstack/react-router'
import { ChatContextProvider } from '@/features/interview/chat/ChatContextProvider'
import { Room } from '@/features/interview/session/Room'

export const Route = createFileRoute('/(authenticated)/interview/$id')({
  beforeLoad: ({ params, location }) => {
    const { id } = params

    // if you didn't come from prejoin, then redirect to prejoin
    if (location.state?.stage !== 'prejoin') {
      throw redirect({
        to: '/interview/prejoin/$id',
        params: { id },
        replace: true,
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ChatContextProvider>
      <Room />
    </ChatContextProvider>
  )
}
