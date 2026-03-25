import { createTheme, DEFAULT_THEME } from '@mantine/core'

export const theme = createTheme({
  // mantine theme override
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  colors: {
    // higher contrast dark theme: blacker backgrounds instead of default grayish
    dark: [
      '#C9C9C9',
      '#B8B8B8',
      '#828282',
      '#696969',
      '#4E4E4E',
      '#353535',
      '#161616',
      '#0e0e0e',
      '#080808',
      '#020202',
    ],
  },
  breakpoints: {
    ...DEFAULT_THEME.breakpoints,
    // normal laptop size would be around 1536 pixels, so we can use this new xl breakpoint to detect large monitors
    xl: '100em',
  },
})
