import { createFileRoute } from '@tanstack/react-router'
import { PreviewContextProvider } from '@/features/interview/prejoin/components/PreviewContextProvider'
import { PrejoinScreen } from '@/features/interview/prejoin/PrejoinScreen'

export const Route = createFileRoute('/(authenticated)/interview/prejoin/')({
  component: PrejoinLayout,
})

function PrejoinLayout() {
  return (
    <PreviewContextProvider>
      <PrejoinScreen />
    </PreviewContextProvider>
  )
}
