import { ReactNode } from 'react';
import { Box } from '@mantine/core';

interface CornerProps {
  children: ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  xOffset?: number;
  yOffset?: number;
}

export function Corner({
  children,
  position = 'top-left',
  xOffset = 10,
  yOffset = 10,
}: CornerProps) {
  const styleMap = {
    'top-left': { top: yOffset, left: xOffset },
    'top-right': { top: yOffset, right: xOffset },
    'bottom-left': { bottom: yOffset, left: xOffset },
    'bottom-right': { bottom: yOffset, right: xOffset },
  };

  return (
    <Box
      style={{
        position: 'absolute',
        ...styleMap[position],
      }}
    >
      {children}
    </Box>
  );
}
