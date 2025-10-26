import { createTheme, DEFAULT_THEME } from '@mantine/core'

export const theme = createTheme({
  // mantine theme override
  breakpoints: {
    ...DEFAULT_THEME.breakpoints,
    // normal laptop size would be around 1536 pixels, so we can use this new xl breakpoint to detect large monitors
    xl: '100em',
  },
})
