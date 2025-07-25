import { Button, Tooltip } from '@mantine/core'
import { IconPhoneOff } from '@tabler/icons-react'
import { useAppIsColorblindModeOn } from '@/useAppStore'
import { getHighlightColor } from '@/utils/utils'
import { useZoomSessionStore } from '../../zoom/useZoomSessionStore'

export function EndCallButton() {
  const leave = useZoomSessionStore(s => s.leave)
  const isColorblindModeOn = useAppIsColorblindModeOn()

  return (
    <Tooltip label="Leave interview" color="gray">
      <Button color={getHighlightColor(isColorblindModeOn)} onClick={leave} radius="xl">
        <IconPhoneOff size={18} style={{ fill: 'white', stroke: 'white' }} />
      </Button>
    </Tooltip>
  )
}
