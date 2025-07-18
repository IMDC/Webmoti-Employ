import { Button } from '@mantine/core'
import { IconBadgeCcFilled } from '@tabler/icons-react'

interface ToggleCaptionsButtonProps {
  isCaptionsAreaOpen: boolean
  toggleCaptionsArea: () => void
}

export function ToggleCaptionsButton({
  isCaptionsAreaOpen,
  toggleCaptionsArea,
}: ToggleCaptionsButtonProps) {
  return (
    <Button
      variant={isCaptionsAreaOpen ? 'filled' : 'default'}
      radius={isCaptionsAreaOpen ? 'sm' : 'xl'}
      onClick={toggleCaptionsArea}
    >
      <IconBadgeCcFilled />
    </Button>
  )
}
