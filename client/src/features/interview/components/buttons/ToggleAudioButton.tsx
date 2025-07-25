import { Button, Indicator, Tooltip } from '@mantine/core'
import { IconMicrophoneFilled, IconMicrophoneOff } from '@tabler/icons-react'
import { useAppIsColorblindModeOn, useAppPermissionState } from '@/useAppStore'
import { getHighlightColor } from '@/utils/utils'
import { useZoomSessionStore } from '../../zoom/useZoomSessionStore'

interface ToggleAudioButtonProps {
  onToggleMic: () => Promise<void>
}

export function ToggleAudioButton({ onToggleMic }: ToggleAudioButtonProps) {
  const permissionState = useAppPermissionState()
  const isAudioOn = useZoomSessionStore(state => state.isAudioOn)
  const isColorblindModeOn = useAppIsColorblindModeOn()

  return (
    <Indicator color="orange" disabled={permissionState !== 'denied'}>
      <Tooltip
        label={isAudioOn ? 'Turn off microphone' : 'Turn on microphone'}
        color="gray"
      >
        <Button
          variant={isAudioOn ? 'default' : 'filled'}
          color={getHighlightColor(isColorblindModeOn)}
          px={{ base: 'sm', sm: 'md' }}
          onClick={onToggleMic}
          disabled={permissionState === 'idle' || permissionState === 'acquiring'}
        >
          {isAudioOn
            ? <IconMicrophoneFilled size={18} />
            : <IconMicrophoneOff size={18} style={{ fill: 'white', stroke: 'white' }} />}
        </Button>
      </Tooltip>
    </Indicator>

  )
}
