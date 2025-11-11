import { beforeEach, describe, expect, it, vi } from 'vitest'
import { openGoogleCalendarTab } from './calendar'

describe('openGoogleCalendarTab', () => {
  beforeEach(() => {
    // Mock window.open
    vi.stubGlobal('open', vi.fn())
    // Mock window.location
    vi.stubGlobal('location', { origin: 'https://example.com' })
  })

  it('should open Google Calendar with correct URL format', () => {
    const startTime = new Date('2024-12-01T09:00:00Z')
    const endTime = new Date('2024-12-01T10:00:00Z')
    const invites = ['user1@example.com', 'user2@example.com']
    const sessionId = 'test-session-123'

    openGoogleCalendarTab(startTime, endTime, invites, sessionId)

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://calendar.google.com/calendar/u/0/r/eventedit'),
      '_blank',
    )
  })

  it('should include event title in the URL', () => {
    const startTime = new Date('2024-12-01T09:00:00Z')
    const endTime = new Date('2024-12-01T10:00:00Z')
    const invites = ['user1@example.com']
    const sessionId = 'test-session-123'

    openGoogleCalendarTab(startTime, endTime, invites, sessionId)

    const callArgs = (window.open as ReturnType<typeof vi.fn>).mock.calls[0]
    const url = callArgs[0]

    expect(url).toContain('text=WebMoti-Employ%20Interview')
  })

  it('should include all invitee emails', () => {
    const startTime = new Date('2024-12-01T09:00:00Z')
    const endTime = new Date('2024-12-01T10:00:00Z')
    const invites: string[] = ['user1@example.com', 'user2@example.com']
    const sessionId = 'test-session-123'

    openGoogleCalendarTab(startTime, endTime, invites, sessionId)

    const callArgs = (window.open as ReturnType<typeof vi.fn>).mock.calls[0]
    const url = callArgs[0]

    expect(url).toContain('add=user1%40example.com%2Cuser2%40example.com')
  })

  it('should include interview join link in description', () => {
    const startTime = new Date('2024-12-01T09:00:00Z')
    const endTime = new Date('2024-12-01T10:00:00Z')
    const invites: string[] = []
    const sessionId = 'test-session-123'

    openGoogleCalendarTab(startTime, endTime, invites, sessionId)

    const callArgs = (window.open as ReturnType<typeof vi.fn>).mock.calls[0]
    const url = callArgs[0]

    expect(url).toContain('interview%2Ftest-session-123')
  })

  it('should format dates in UTC', () => {
    const startTime = new Date('2024-12-01T09:00:00Z')
    const endTime = new Date('2024-12-01T10:00:00Z')
    const invites: string[] = []
    const sessionId = 'test-session-123'

    openGoogleCalendarTab(startTime, endTime, invites, sessionId)

    const callArgs = (window.open as ReturnType<typeof vi.fn>).mock.calls[0]
    const url = callArgs[0]

    // Should contain date format like 20241201T090000Z
    expect(url).toContain('dates=20241201T090000Z')
    expect(url).toContain('20241201T100000Z')
  })
})
