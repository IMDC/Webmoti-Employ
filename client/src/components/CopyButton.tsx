import { IconCheck, IconCopy } from '@tabler/icons-react';
import { ActionIcon, CopyButton as MantineCopyButton, Tooltip } from '@mantine/core';

interface CopyButtonProps {
  copyText: string;
}

export function CopyButton({ copyText }: CopyButtonProps) {
  return (
    <MantineCopyButton value={copyText} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
          <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </ActionIcon>
        </Tooltip>
      )}
    </MantineCopyButton>
  );
}
