import { createFileRoute } from '@tanstack/react-router';
import { VideoApp } from '@/features/video/VideoApp';

export const Route = createFileRoute('/$id')({
  component: VideoApp,
});
