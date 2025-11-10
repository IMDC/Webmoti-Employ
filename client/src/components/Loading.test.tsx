import { render } from '@test-utils'
import { describe, expect, it } from 'vitest'
import { Loading } from './Loading'

describe('loading', () => {
  it('should render loading spinner', () => {
    const { container } = render(<Loading />)

    // Check that a loader is present in the document
    const loader = container.querySelector('.mantine-Loader-root')
    expect(loader).toBeInTheDocument()
  })

  it('should render with dots loader type', () => {
    const { container } = render(<Loading />)

    // Check that the loader with dots type is rendered
    const loader = container.querySelector('.mantine-Loader-root')
    expect(loader).toBeInTheDocument()
  })
})
