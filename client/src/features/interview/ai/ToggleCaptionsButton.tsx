import { Button, Tooltip } from '@mantine/core'
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
    <Tooltip
      color="gray"
      label={isCaptionsAreaOpen ? 'Turn off captions' : 'Turn on captions'}
    >
      <Button
        variant={isCaptionsAreaOpen ? 'filled' : 'default'}
        radius={isCaptionsAreaOpen ? 'sm' : 'xl'}
        onClick={toggleCaptionsArea}
      >
        <IconBadgeCcFilled />
      </Button>
    </Tooltip>
  )
}
