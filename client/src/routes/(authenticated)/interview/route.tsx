import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ZoomSessionContextProvider } from '@/features/interview/zoom/ZoomSessionContextProvider';

export const Route = createFileRoute('/(authenticated)/interview')({
  component: ZoomSessionLayout,
});

function ZoomSessionLayout() {
  return (
    // the zoom client created by this context provider will exist in:
    // /interview/prejoin and /interview/$id routes.
    // it will be destroyed when navigating away from these routes.
    <ZoomSessionContextProvider>
      <Outlet />
    </ZoomSessionContextProvider>
  );
}
