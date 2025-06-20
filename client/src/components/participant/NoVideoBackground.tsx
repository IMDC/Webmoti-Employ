import { useRef } from 'react';
import { Avatar, Box, Center } from '@mantine/core';

function getRandomColorPair() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70;
  const lightness1 = 65;
  const lightness2 = 55;

  return {
    gradient: `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness1}%), hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness2}%))`,
    avatar: `hsl(${hue}, ${saturation}%, 50%)`,
  };
}

export function NoVideoBackground() {
  const { gradient, avatar } = useRef(getRandomColorPair()).current;

  return (
    <>
      <Box
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: gradient,
          filter: 'blur(20px)',
        }}
      />
      <Center
        w="100%"
        h="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <Avatar
          style={{
            backgroundColor: avatar,
            height: 'clamp(50px, 25%, 150px)',
            width: 'auto',
            aspectRatio: '1 / 1',
          }}
        />
      </Center>
    </>
  );
}
