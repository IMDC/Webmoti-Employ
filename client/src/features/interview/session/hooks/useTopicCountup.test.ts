import type { IntervieweeNotificationState, InterviewerNotificationState } from '../../ai/NotificationState'
import { act, renderHook } from '@testing-library/react'
import { useTopicCountup } from './useTopicCountup'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useTopicCountup', () => {
  it('starts at 0 with no new topic', () => {
    const notification: IntervieweeNotificationState = {
      role: 'interviewee',
      hint: [],
      fillerCount: 0,
      wordCount: 0,
      newTopic: false,
      offTopic: false,
    }

    const { result } = renderHook(() => useTopicCountup(notification))
    expect(result.current).toBe(0)
  })

  it('starts counting when newTopic is true', () => {
    const notification: IntervieweeNotificationState = {
      role: 'interviewee',
      hint: [],
      fillerCount: 0,
      wordCount: 0,
      newTopic: true,
      offTopic: false,
    }

    const { result } = renderHook(() => useTopicCountup(notification))

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current).toBe(3)
  })

  it('resets and restarts on a new topic', () => {
    const initial: IntervieweeNotificationState = {
      role: 'interviewee',
      hint: [],
      fillerCount: 0,
      wordCount: 0,
      newTopic: true,
      offTopic: false,
    }

    const { result, rerender } = renderHook(
      ({ n }) => useTopicCountup(n),
      { initialProps: { n: initial as any } },
    )

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current).toBe(5)

    // Toggle newTopic off first, then back on to trigger reset
    rerender({ n: { ...initial, newTopic: false } })
    rerender({ n: { ...initial, newTopic: true } })

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current).toBe(2)
  })

  it('returns 0 for interviewer notifications', () => {
    const notification: InterviewerNotificationState = {
      role: 'interviewer',
      hint: [],
    }

    const { result } = renderHook(() => useTopicCountup(notification))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current).toBe(0)
  })

  it('stops and resets when notification switches to interviewer role', () => {
    const intervieweeNotification: IntervieweeNotificationState = {
      role: 'interviewee',
      hint: [],
      fillerCount: 0,
      wordCount: 0,
      newTopic: true,
      offTopic: false,
    }

    const { result, rerender } = renderHook(
      ({ n }) => useTopicCountup(n),
      { initialProps: { n: intervieweeNotification as any } },
    )

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current).toBe(3)

    // Switch to interviewer
    const interviewerNotification: InterviewerNotificationState = {
      role: 'interviewer',
      hint: [],
    }
    rerender({ n: interviewerNotification })

    expect(result.current).toBe(0)
  })
})
