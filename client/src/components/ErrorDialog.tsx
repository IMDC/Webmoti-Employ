import { Dialog, Text } from '@mantine/core'
import { useAppStore } from '@/useAppStore'
import { formatAppError } from '@/utils/utils'

export function ErrorDialog() {
  const error = useAppStore(state => state.error)
  const clearError = useAppStore(state => state.clearError)

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
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{formatted}</pre>
    </Dialog>
  )
}
