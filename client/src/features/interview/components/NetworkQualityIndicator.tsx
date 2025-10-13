import { alpha, Box, Group, useMantineTheme } from '@mantine/core'

interface NetworkQualityProps {
  level: number | null
}

export default function NetworkQualityIndicator({ level }: NetworkQualityProps) {
  const theme = useMantineTheme()
  const bars = [0, 1, 2, 3, 4]

  return (
    <Group gap={1} align="end" justify="flex-end">
      {bars.map((bar, i) => (
        <Box
          key={bar}
          w={3}
          h={(i + 1) * 3}
          bg={level !== null && level > i ? theme.colors.gray[3] : alpha(theme.white, 0.2)}
        />
      ))}
    </Group>
  )
}
