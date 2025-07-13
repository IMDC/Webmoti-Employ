import { Button, Indicator } from '@mantine/core'
import { IconVideoFilled, IconVideoOff } from '@tabler/icons-react'
import { useAppStore } from '@/useAppStore'

interface ToggleVideoButtonProps {
  onToggleVideo: () => Promise<void>
}

export function ToggleVideoButton({ onToggleVideo }: ToggleVideoButtonProps) {
  const permissionState = useAppStore(state => state.permissionState)
  const isVideoOn = useAppStore(state => state.isVideoOn)

  return (
    <Indicator color="orange" disabled={permissionState !== 'denied'}>
      <Button
        variant={isVideoOn ? 'default' : 'filled'}
        color="red"
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
