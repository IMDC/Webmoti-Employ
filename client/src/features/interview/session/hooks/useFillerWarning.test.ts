import type { IntervieweeNotificationState, InterviewerNotificationState } from '../../ai/NotificationState'
import { renderHook } from '@testing-library/react'
import { useFillerWarning } from './useFillerWarning'

describe('useFillerWarning', () => {
  it('returns false for interviewer notifications', () => {
    const notification: InterviewerNotificationState = {
      role: 'interviewer',
      hint: [],
    }
    const { result } = renderHook(() => useFillerWarning(notification))
    expect(result.current).toBe(false)
  })

  it('returns false when word count is below minimum (10)', () => {
    const notification: IntervieweeNotificationState = {
      role: 'interviewee',
      hint: [],
      fillerCount: 5, // 5/9 = 55%, but only 9 words
      wordCount: 9,
      newTopic: false,
      offTopic: false,
    }
    const { result } = renderHook(() => useFillerWarning(notification))
    expect(result.current).toBe(false)
  })

  it('returns false when filler ratio is below 8%', () => {
    const notification: IntervieweeNotificationState = {
      role: 'interviewee',
      hint: [],
      fillerCount: 0, // 0%
      wordCount: 100,
      newTopic: false,
      offTopic: false,
    }
    const { result } = renderHook(() => useFillerWarning(notification))
    expect(result.current).toBe(false)
  })

  it('returns true when word count >= 10 and filler ratio >= 8%', () => {
    const notification: IntervieweeNotificationState = {
      role: 'interviewee',
      hint: [],
      fillerCount: 1, // 1/10 = 10% >= 8%
      wordCount: 10,
      newTopic: false,
      offTopic: false,
    }
    const { result } = renderHook(() => useFillerWarning(notification))
    expect(result.current).toBe(true)
  })

  it('returns false at exactly the boundary (just below 8%)', () => {
    const notification: IntervieweeNotificationState = {
      role: 'interviewee',
      hint: [],
      fillerCount: 7, // 7/100 = 7% < 8%
      wordCount: 100,
      newTopic: false,
      offTopic: false,
    }
    const { result } = renderHook(() => useFillerWarning(notification))
    expect(result.current).toBe(false)
  })

  it('returns true at exactly the 8% boundary', () => {
    const notification: IntervieweeNotificationState = {
      role: 'interviewee',
      hint: [],
      fillerCount: 8, // 8/100 = exactly 8%
      wordCount: 100,
      newTopic: false,
      offTopic: false,
    }
    const { result } = renderHook(() => useFillerWarning(notification))
    expect(result.current).toBe(true)
  })
})
