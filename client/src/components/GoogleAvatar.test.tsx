import { render } from '@test-utils'
import { describe, expect, it } from 'vitest'
import { GoogleAvatar } from './GoogleAvatar'

describe('googleAvatar', () => {
  it('should render avatar with no-referrer policy', () => {
    const { container } = render(<GoogleAvatar src="https://example.com/avatar.jpg" />)

    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('referrerpolicy', 'no-referrer')
  })

  it('should render avatar with provided src', () => {
    const { container } = render(<GoogleAvatar src="https://example.com/avatar.jpg" />)

    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('should not be draggable', () => {
    const { container } = render(<GoogleAvatar src="https://example.com/avatar.jpg" />)

    const avatar = container.querySelector('.mantine-Avatar-root')
    expect(avatar).toBeInTheDocument()
    // The draggable prop is passed to the root element
    expect(avatar).toHaveAttribute('draggable', 'false')
  })

  it('should accept additional Avatar props', () => {
    const { container } = render(
      <GoogleAvatar
        src="https://example.com/avatar.jpg"
        alt="User Avatar"
        radius="xl"
      />,
    )

    const img = container.querySelector('img')
    expect(img).toHaveAttribute('alt', 'User Avatar')
  })
})
