import { Button, Indicator } from '@mantine/core'
import { IconVideoFilled, IconVideoOff } from '@tabler/icons-react'
import { useAppStore } from '@/useAppStore'
import { getHighlightColor } from '@/utils/utils'
import { useZoomSessionStore } from '../../zoom/useZoomSessionStore'

interface ToggleVideoButtonProps {
  onToggleVideo: () => Promise<void>
}

export function ToggleVideoButton({ onToggleVideo }: ToggleVideoButtonProps) {
  const permissionState = useAppStore(state => state.permissionState)
  const isVideoOn = useZoomSessionStore(state => state.isVideoOn)
  const isColorblindModeOn = useAppStore(s => s.isColorblindModeOn)

  return (
    <Indicator color="orange" disabled={permissionState !== 'denied'}>
      <Button
        variant={isVideoOn ? 'default' : 'filled'}
        color={getHighlightColor(isColorblindModeOn)}
        px={{ base: 'sm', sm: 'md' }}
        onClick={onToggleVideo}
        disabled={permissionState === 'idle' || permissionState === 'acquiring'}
      >
        {isVideoOn
          ? (<IconVideoFilled size={18} />)
          : (<IconVideoOff style={{ fill: 'white' }} size={18} />)}
      </Button>
    </Indicator>

  )
}
