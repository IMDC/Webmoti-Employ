import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PreviewContextProvider } from '@/features/interview/prejoin/components/PreviewContextProvider'

export const Route = createFileRoute('/(authenticated)/interview/prejoin')({
  component: PrejoinLayout,
})

function PrejoinLayout() {
  return (
    <PreviewContextProvider>
      <Outlet />
    </PreviewContextProvider>
  )
}
