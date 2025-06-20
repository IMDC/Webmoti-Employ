import { ReactNode } from 'react';
import { Box } from '@mantine/core';

interface CornerProps {
  children: ReactNode;
}

export function Corner({ children }: CornerProps) {
  return (
    <Box
      style={{
        position: 'absolute',
        bottom: 6,
        left: 8,
        zIndex: 1,
      }}
    >
      {children}
    </Box>
  );
}
