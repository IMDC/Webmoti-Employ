import { Button, Indicator } from '@mantine/core'
import { IconMicrophoneFilled, IconMicrophoneOff } from '@tabler/icons-react'
import { useAppStore } from '@/useAppStore'
import { getHighlightColor } from '@/utils/utils'

interface ToggleAudioButtonProps {
  onToggleMic: () => Promise<void>
}

export function ToggleAudioButton({ onToggleMic }: ToggleAudioButtonProps) {
  const permissionState = useAppStore(state => state.permissionState)
  const isAudioOn = useAppStore(state => state.isAudioOn)
  const isColorblindModeOn = useAppStore(s => s.isColorblindModeOn)

  return (
    <Indicator color="orange" disabled={permissionState !== 'denied'}>
      <Button
        variant={isAudioOn ? 'default' : 'filled'}
        color={getHighlightColor(isColorblindModeOn)}
        px={{ base: 'sm', sm: 'md' }}
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
