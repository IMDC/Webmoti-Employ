import { PrejoinScreen } from '@/features/interview/prejoin/PrejoinScreen';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(authenticated)/interview/prejoin/')({
  component: PrejoinScreen,
});
