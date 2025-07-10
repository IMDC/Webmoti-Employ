import { createFileRoute } from '@tanstack/react-router'
import { ChatContextProvider } from '@/features/interview/chat/ChatContextProvider'
import { Room } from '@/features/interview/session/Room'

export const Route = createFileRoute('/(authenticated)/interview/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ChatContextProvider>
      <Room />
    </ChatContextProvider>
  )
}
