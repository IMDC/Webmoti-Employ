import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DeviceContextProvider } from '@/features/interview/zoom/DeviceContextProvider'
import { ZoomSessionContextProvider } from '@/features/interview/zoom/ZoomSessionContextProvider'

export const Route = createFileRoute('/(authenticated)/interview')({
  // set fromInterview so navigating to /end won't redirect
  beforeLoad: () => sessionStorage.setItem('fromInterview', '1'),
  component: ZoomSessionLayout,
})

function ZoomSessionLayout() {
  // the zoom client created by ZoomSessionContextProvider will exist in:
  // /interview/prejoin and /interview/$id routes.
  // it will be destroyed when navigating away from these routes.
  return (
    <DeviceContextProvider>
      <ZoomSessionContextProvider>
        <Outlet />
      </ZoomSessionContextProvider>
    </DeviceContextProvider>
  )
}
