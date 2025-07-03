import { createFileRoute } from '@tanstack/react-router';
import { EndScreen } from '@/features/video/end/EndScreen';

export const Route = createFileRoute('/(authenticated)/end')({
  component: EndScreen,
});
