import { Button, Popover, Tooltip } from '@mantine/core'
import { IconChevronUp } from '@tabler/icons-react'
import { useAppPermissionState } from '@/useAppStore'
import { ChangeMediaDevice } from '../ChangeMediaDevice'

interface ChangeAudioPopoverProps {
  switchMicrophone: (deviceId: string) => Promise<void>
  switchSpeaker: (deviceId: string) => Promise<void>
}

export function ChangeAudioPopover({ switchMicrophone, switchSpeaker }: ChangeAudioPopoverProps) {
  const permissionState = useAppPermissionState()
  const disableMediaButtons = permissionState === 'idle' || permissionState === 'acquiring'

  return (
    <Popover>
      <Popover.Target>
        <Tooltip color="gray" label="Change audio device">
          <Button variant="default" disabled={disableMediaButtons} px="xs" aria-label="Change audio device">
            <IconChevronUp size={18} />
          </Button>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <ChangeMediaDevice
          mediaType="audio"
          variant="radio"
          onSwitchMicrophone={switchMicrophone}
          onSwitchSpeaker={switchSpeaker}
        />
      </Popover.Dropdown>
    </Popover>
  )
}
