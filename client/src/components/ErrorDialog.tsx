import { Dialog, Text } from '@mantine/core';
import { AppError, useAppStore } from '@/stores/useAppStore';

export function formatAppError(error: AppError): string {
  const { status, message, details } = error;

  const lines = [];

  if (status !== undefined) {
    lines.push(`Status: ${status}`);
  }

  if (message && message.length > 0) {
    lines.push(`Message: ${message}`);
  }

  if (details !== undefined) {
    const detailsText = typeof details === 'string' ? details : JSON.stringify(details, null, 2);

    if (detailsText.length > 0) {
      lines.push(`Details:\n${detailsText}`);
    }
  }

  return lines.join('\n');
}

export function ErrorDialog() {
  const error = useAppStore((state) => state.error);
  const clearError = useAppStore((state) => state.clearError);

  if (!error) {
    return null;
  }

  const formatted = formatAppError(error);

  return (
    <Dialog
      opened={!!error}
      withCloseButton
      onClose={clearError}
      size="lg"
      radius="md"
      pr="xl"
      pl="xl"
      pt="lg"
      pb="sm"
      withBorder
      position={{ top: 20, right: 20 }}
      zIndex={9999}
    >
      <Text fw="bolder">Error</Text>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{formatted}</pre>
    </Dialog>
  );
}
