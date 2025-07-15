import type {
  RenderResult,
} from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { render as rtlRender } from '@testing-library/react'
import { theme } from '../src/theme'

export function render(ui: React.ReactNode): RenderResult {
  return rtlRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider theme={theme}>{children}</MantineProvider>
    ),
  })
}
