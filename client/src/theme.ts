import { createTheme, DEFAULT_THEME } from '@mantine/core'

export const theme = createTheme({
  focusRing: 'auto',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  primaryColor: 'accent',
  colors: {
    accent: [
      '#edf2ff',
      '#dbe4ff',
      '#bac8ff',
      '#91a7ff',
      '#748ffc',
      '#5c7cfa',
      '#4c6ef5',
      '#4263eb',
      '#3b5bdb',
      '#364fc7',
    ],
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
    light: [
      '#fafaf9',
      '#f5f5f4',
      '#e7e5e4',
      '#d6d3d1',
      '#a8a29e',
      '#78716c',
      '#57534e',
      '#44403c',
      '#292524',
      '#1c1917',
    ],
  },
  breakpoints: {
    ...DEFAULT_THEME.breakpoints,
    // normal laptop size would be around 1536 pixels, so we can use this new xl breakpoint to detect large monitors
    xl: '100em',
  },
})
