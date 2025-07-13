import { Button, Indicator } from '@mantine/core'
import { IconMicrophoneFilled, IconMicrophoneOff } from '@tabler/icons-react'
import { useAppStore } from '@/useAppStore'

interface ToggleAudioButtonProps {
  onToggleMic: () => Promise<void>
}

export function ToggleAudioButton({ onToggleMic }: ToggleAudioButtonProps) {
  const permissionState = useAppStore(state => state.permissionState)
  const isAudioOn = useAppStore(state => state.isAudioOn)

  return (
    <Indicator color="orange" disabled={permissionState !== 'denied'}>
      <Button
        variant={isAudioOn ? 'default' : 'filled'}
        color="red"
        onClick={onToggleMic}
        disabled={permissionState === 'idle' || permissionState === 'acquiring'}
      >
        {isAudioOn
          ? (<IconMicrophoneFilled size={18} />)
          : (<IconMicrophoneOff size={18} style={{ fill: 'white' }} />)}
      </Button>
    </Indicator>

  )
}
