import { ActionIcon, CopyButton as MantineCopyButton, Tooltip } from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'

interface MyCopyButtonProps {
  copyText: string
  copyTooltip?: string
}

export function MyCopyButton({ copyText, copyTooltip = 'Copy' }: MyCopyButtonProps) {
  return (
    <MantineCopyButton value={copyText} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip color="gray" label={copied ? 'Copied' : copyTooltip} withArrow position="right">
          <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </ActionIcon>
        </Tooltip>
      )}
    </MantineCopyButton>
  )
}
