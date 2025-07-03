import { createFileRoute } from '@tanstack/react-router';
import { PrejoinScreen } from '@/features/video/prejoin/PrejoinScreen';

export const Route = createFileRoute('/(authenticated)/interview/prejoin')({
  component: PrejoinScreen,
});
