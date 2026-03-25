import { Button, Indicator, Tooltip } from '@mantine/core'
import { IconVideoFilled, IconVideoOff } from '@tabler/icons-react'
import { useAppIsColorblindModeOn, useAppPermissionState } from '@/useAppStore'
import { getHighlightColor } from '@/utils/utils'
import { useIsVideoOn } from '../../zoom/useZoomSessionStore'

interface ToggleVideoButtonProps {
  onToggleVideo: () => Promise<void>
}

export function ToggleVideoButton({ onToggleVideo }: ToggleVideoButtonProps) {
  const permissionState = useAppPermissionState()
  const isVideoOn = useIsVideoOn()
  const isColorblindModeOn = useAppIsColorblindModeOn()

  return (
    <Indicator color="orange" disabled={permissionState !== 'denied'}>
      <Tooltip label={isVideoOn ? 'Turn off camera' : 'Turn on camera'} color="gray">
        <Button
          variant={isVideoOn ? 'default' : 'filled'}
          color={getHighlightColor(isColorblindModeOn)}
          px={{ base: 'sm', sm: 'md' }}
          onClick={onToggleVideo}
          disabled={permissionState === 'idle' || permissionState === 'acquiring'}
          aria-label={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          aria-pressed={isVideoOn}
        >
          {isVideoOn
            ? <IconVideoFilled size={18} />
            : <IconVideoOff style={{ fill: 'white', stroke: 'white' }} size={18} />}
        </Button>
      </Tooltip>
    </Indicator>

  )
}
