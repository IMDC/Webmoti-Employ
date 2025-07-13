import { Button } from '@mantine/core'
import { IconPhoneOff } from '@tabler/icons-react'
import { useZoomSessionStore } from '../../zoom/useZoomSessionStore'

export function EndCallButton() {
  const leave = useZoomSessionStore(s => s.leave)

  return (
    <Button color="red" onClick={leave} radius="xl">
      <IconPhoneOff size={18} style={{ fill: 'white' }} />
    </Button>
  )
}
