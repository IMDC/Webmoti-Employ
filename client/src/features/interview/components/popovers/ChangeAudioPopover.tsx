import { Button, Popover, Tooltip } from '@mantine/core'
import { IconChevronUp } from '@tabler/icons-react'
import { useAppPermissionState } from '@/useAppStore'
import { ChangeMediaDevice } from '../ChangeMediaDevice'

interface ChangeAudioPopoverProps {
  switchMicrophone: (deviceId: string) => Promise<void>
}

export function ChangeAudioPopover({ switchMicrophone }: ChangeAudioPopoverProps) {
  const permissionState = useAppPermissionState()
  const disableMediaButtons = permissionState === 'idle' || permissionState === 'acquiring'

  return (
    <Popover>
      <Popover.Target>
        <Tooltip color="gray" label="Change audio device">
          <Button variant="default" disabled={disableMediaButtons} px="xs">
            <IconChevronUp size={18} />
          </Button>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <ChangeMediaDevice
          mediaType="audio"
          variant="radio"
          onSwitchMicrophone={switchMicrophone}
        />
      </Popover.Dropdown>
    </Popover>
  )
}
