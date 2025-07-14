import { createFileRoute, redirect } from '@tanstack/react-router'
import { ChatContextProvider } from '@/features/interview/chat/ChatContextProvider'
import { Room } from '@/features/interview/session/Room'

export const Route = createFileRoute('/(authenticated)/interview/$id')({
  beforeLoad: ({ params }) => {
    const allowed = sessionStorage.getItem('fromPrejoin') === '1'

    // if you didn't come from prejoin, then redirect to prejoin
    if (!allowed) {
      throw redirect({
        to: '/interview/prejoin/$id',
        params: { id: params.id },
        replace: true,
      })
    }

    // you're allowed, so reset this flag.
    // now when you refresh, this flag will be gone and you'll navigate to prejoin
    sessionStorage.removeItem('fromPrejoin')
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
