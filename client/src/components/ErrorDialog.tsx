import { Dialog, Text } from '@mantine/core';
import { useAppStore } from '@/stores/useAppStore';

export function ErrorDialog() {
  const error = useAppStore((state) => state.error);
  const clearError = useAppStore((state) => state.clearError);

  return (
    <Dialog
      opened={!!error}
      withCloseButton
      onClose={clearError}
      size="lg"
      radius="md"
      withBorder
      position={{ top: 20, right: 20 }}
    >
      <Text>{error}</Text>
    </Dialog>
  );
}
