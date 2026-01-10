import { Modal, Stack, Text } from '@mantine/core'
import { DateTime } from 'luxon'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

// injected at build time
declare const __APP_VERSION__: string
declare const __APP_SHA__: string
declare const __APP_COMMIT_DATE__: string
declare const __APP_BUILD_DATE__: string

function formatDate(iso: string) {
  return DateTime.fromISO(iso, { zone: 'utc' }).toFormat('yyyy-MM-dd HH:mm \'UTC\'')
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="About"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <Stack>
        <Text ff="monospace">{`Client Version: ${__APP_VERSION__}`}</Text>
        <Text ff="monospace">{`Commit SHA: ${__APP_SHA__}`}</Text>
        <Text ff="monospace">{`Commit Date: ${formatDate(__APP_COMMIT_DATE__)}`}</Text>
        <Text ff="monospace">{`Built At: ${formatDate(__APP_BUILD_DATE__)}`}</Text>
      </Stack>
    </Modal>
  )
}
