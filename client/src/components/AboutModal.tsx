import { Divider, Modal, Stack, Text } from '@mantine/core'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { isElectron } from '@/utils/utils'

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
        <Text ff="monospace">{`Client Version: ${__APP_VERSION__}`}</Text>
        <Text ff="monospace">{`Commit SHA: ${__APP_SHA__}`}</Text>
        <Text ff="monospace">{`Commit Date: ${formatDate(__APP_COMMIT_DATE__)}`}</Text>
        <Text ff="monospace">{`Built At: ${formatDate(__APP_BUILD_DATE__)}`}</Text>

        {isElectron() && electronInfo && (
          <>
            <Divider />
            <Text ff="monospace">{`Electron Version: ${electronInfo.version}`}</Text>
            <Text ff="monospace">{`Electron SHA: ${electronInfo.sha}`}</Text>
            <Text ff="monospace">{`Electron Commit Date: ${formatDate(electronInfo.commitDate)}`}</Text>
            <Text ff="monospace">{`Electron Built At: ${formatDate(electronInfo.buildDate)}`}</Text>
          </>
        )}
      </Stack>
    </Modal>
  )
}
