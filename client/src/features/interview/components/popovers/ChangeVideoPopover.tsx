import { Button, Popover, Tooltip } from '@mantine/core'
import { IconChevronUp } from '@tabler/icons-react'
import { useAppPermissionState } from '@/useAppStore'
import { ChangeMediaDevice } from '../ChangeMediaDevice'

interface ChangeVideoPopoverProps {
  switchCamera: (deviceId: string) => Promise<void>
}

export function ChangeVideoPopover({ switchCamera }: ChangeVideoPopoverProps) {
  const permissionState = useAppPermissionState()
  const disableMediaButtons = permissionState === 'idle' || permissionState === 'acquiring'

  return (
    <Popover>
      <Popover.Target>
        <Tooltip color="gray" label="Change video device">
          <Button variant="default" disabled={disableMediaButtons} px="xs" aria-label="Change video device">
            <IconChevronUp size={18} />
          </Button>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <ChangeMediaDevice
          mediaType="video"
          variant="radio"
          onSwitchCamera={switchCamera}
        />
      </Popover.Dropdown>
    </Popover>
  )
}
