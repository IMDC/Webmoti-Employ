import { ReactNode } from 'react';
import { Box } from '@mantine/core';

interface CornerProps {
  children: ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function Corner({ children, position = 'bottom-left' }: CornerProps) {
  const styleMap = {
    'top-left': { top: 6, left: 8 },
    'top-right': { top: 6, right: 8 },
    'bottom-left': { bottom: 6, left: 8 },
    'bottom-right': { bottom: 6, right: 8 },
  };

  return (
    <Box
      style={{
        position: 'absolute',
        zIndex: 1,
        ...styleMap[position],
      }}
    >
      {children}
    </Box>
  );
}
