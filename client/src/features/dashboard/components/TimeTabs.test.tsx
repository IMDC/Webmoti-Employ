import { render, screen, userEvent } from '@test-utils'
import { describe, expect, it, vi } from 'vitest'
import { TimeTabs } from './TimeTabs'

describe('timeTabs', () => {
  it('should render all three tabs', () => {
    const mockOnChange = vi.fn()
    render(<TimeTabs value="today" onChange={mockOnChange} />)

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    expect(screen.getByText('Past')).toBeInTheDocument()
  })

  it('should highlight the current tab', () => {
    const mockOnChange = vi.fn()
    const { rerender } = render(<TimeTabs value="today" onChange={mockOnChange} />)

    const todayTab = screen.getByText('Today').closest('button')
    expect(todayTab).toHaveAttribute('data-active', 'true')

    rerender(<TimeTabs value="upcoming" onChange={mockOnChange} />)
    const upcomingTab = screen.getByText('Upcoming').closest('button')
    expect(upcomingTab).toHaveAttribute('data-active', 'true')

    rerender(<TimeTabs value="past" onChange={mockOnChange} />)
    const pastTab = screen.getByText('Past').closest('button')
    expect(pastTab).toHaveAttribute('data-active', 'true')
  })

  it('should call onChange when a tab is clicked', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    render(<TimeTabs value="today" onChange={mockOnChange} />)

    const upcomingTab = screen.getByText('Upcoming')
    await user.click(upcomingTab)

    expect(mockOnChange).toHaveBeenCalledWith('upcoming')
  })

  it('should allow switching between tabs', async () => {
    const user = userEvent.setup()
    const mockOnChange = vi.fn()
    render(<TimeTabs value="today" onChange={mockOnChange} />)

    await user.click(screen.getByText('Upcoming'))
    expect(mockOnChange).toHaveBeenCalledWith('upcoming')

    await user.click(screen.getByText('Past'))
    expect(mockOnChange).toHaveBeenCalledWith('past')

    await user.click(screen.getByText('Today'))
    expect(mockOnChange).toHaveBeenCalledWith('today')
  })

  it('should render with custom value', () => {
    const mockOnChange = vi.fn()
    render(<TimeTabs value="upcoming" onChange={mockOnChange} />)

    const upcomingTab = screen.getByText('Upcoming').closest('button')
    expect(upcomingTab).toHaveAttribute('data-active', 'true')
  })

  it('should have accessible tab structure', () => {
    const mockOnChange = vi.fn()
    render(<TimeTabs value="today" onChange={mockOnChange} />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
  })

  it('should maintain tab order', () => {
    const mockOnChange = vi.fn()
    render(<TimeTabs value="today" onChange={mockOnChange} />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]).toHaveTextContent('Today')
    expect(tabs[1]).toHaveTextContent('Upcoming')
    expect(tabs[2]).toHaveTextContent('Past')
  })
})
