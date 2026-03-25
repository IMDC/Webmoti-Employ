import { Divider, Modal, Stack, Text } from '@mantine/core'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { isElectron } from '@/utils/utils'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

// injected at build time
declare const __APP_VERSION__: string | null
declare const __APP_SHA__: string | null
declare const __APP_COMMIT_DATE__: string | null
declare const __APP_BUILD_DATE__: string

function formatDate(iso: string | null) {
  if (!iso)
    return 'null'

  return DateTime.fromISO(iso, { zone: 'utc' })
    .setZone('America/Toronto')
    .toFormat('yyyy-MM-dd HH:mm ZZZZ')
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [electronInfo, setElectronInfo] = useState<ElectronBuildInfo | null>(null)

  useEffect(() => {
    if (isElectron()) {
      window.electron.getBuildInfo().then(setElectronInfo).catch(() => {
        setElectronInfo(null)
      })
    }
  }, [])

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="About"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <Stack>
        <Text>{`Client Version: ${__APP_VERSION__ ?? 'null'}`}</Text>
        <Text>{`Commit SHA: ${__APP_SHA__}`}</Text>
        <Text>{`Commit Date: ${formatDate(__APP_COMMIT_DATE__)}`}</Text>
        <Text>{`Built At: ${formatDate(__APP_BUILD_DATE__)}`}</Text>

        {isElectron() && electronInfo && (
          <>
            <Divider />
            <Text>{`Electron Version: ${electronInfo.version}`}</Text>
            <Text>{`Electron SHA: ${electronInfo.sha}`}</Text>
            <Text>{`Electron Commit Date: ${formatDate(electronInfo.commitDate)}`}</Text>
            <Text>{`Electron Built At: ${formatDate(electronInfo.buildDate)}`}</Text>
          </>
        )}
      </Stack>
    </Modal>
  )
}
