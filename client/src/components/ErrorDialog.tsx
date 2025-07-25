import { Dialog, Text } from '@mantine/core'
import { useAppActions, useAppError } from '@/useAppStore'
import { formatAppError } from '@/utils/utils'

export function ErrorDialog() {
  const error = useAppError()
  const { clearError } = useAppActions()

  if (!error) {
    return null
  }

  const formatted = formatAppError(error)

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
      <pre
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        {formatted}
      </pre>
    </Dialog>
  )
}
