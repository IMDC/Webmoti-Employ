import { createFileRoute } from '@tanstack/react-router';
import { PrejoinScreen } from '@/features/interview/prejoin/PrejoinScreen';

export const Route = createFileRoute('/(authenticated)/interview/prejoin/create')({
  component: PrejoinScreen,
});
