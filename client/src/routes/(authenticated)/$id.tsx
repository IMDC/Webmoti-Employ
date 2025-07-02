import { createFileRoute } from '@tanstack/react-router';
import { VideoApp } from '@/features/video/VideoApp';
import { ZoomSessionContextProvider } from '@/features/video/zoom/ZoomSessionContextProvider';

export const Route = createFileRoute('/(authenticated)/$id')({
  component: () => (
    <ZoomSessionContextProvider>
      <VideoApp />
    </ZoomSessionContextProvider>
  ),
});
