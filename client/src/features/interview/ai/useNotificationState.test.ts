import type { IntervieweeNotificationState, InterviewerNotificationState } from './NotificationState'
import { act, renderHook } from '@testing-library/react'
import { useNotificationState } from './useNotificationState'

describe('useNotificationState', () => {
  describe('interviewer notifications', () => {
    it('sets hint from incoming interviewer notification', () => {
      const { result } = renderHook(() => useNotificationState())

      act(() => {
        const incoming: InterviewerNotificationState = {
          role: 'interviewer',
          hint: ['Ask about experience'],
        }
        result.current.processNotification(incoming)
      })

      expect(result.current.notification.hint).toEqual(['Ask about experience'])
    })

    it('preserves previous hint when incoming hint is empty', () => {
      const { result } = renderHook(() => useNotificationState())

      act(() => {
        result.current.processNotification({
          role: 'interviewer',
          hint: ['First hint'],
        })
      })

      act(() => {
        result.current.processNotification({
          role: 'interviewer',
          hint: [],
        })
      })

      expect(result.current.notification.hint).toEqual(['First hint'])
    })
  })

  describe('interviewee notifications', () => {
    it('accumulates filler/word counts in sliding window', () => {
      const { result } = renderHook(() => useNotificationState())

      act(() => {
        result.current.processNotification({
          role: 'interviewee',
          hint: [],
          fillerCount: 2,
          wordCount: 20,
          newTopic: false,
          offTopic: false,
        })
      })

      act(() => {
        result.current.processNotification({
          role: 'interviewee',
          hint: [],
          fillerCount: 3,
          wordCount: 30,
          newTopic: false,
          offTopic: false,
        })
      })

      const n = result.current.notification as IntervieweeNotificationState
      expect(n.fillerCount).toBe(5) // 2 + 3
      expect(n.wordCount).toBe(50) // 20 + 30
    })

    it('sliding window drops oldest entry after 5 notifications', () => {
      const { result } = renderHook(() => useNotificationState())

      // Push 6 notifications — window size is 5, so first should be dropped
      for (let i = 1; i <= 6; i++) {
        act(() => {
          result.current.processNotification({
            role: 'interviewee',
            hint: [],
            fillerCount: 1,
            wordCount: 10,
            newTopic: false,
            offTopic: false,
          })
        })
      }

      const n = result.current.notification as IntervieweeNotificationState
      // Window only keeps 5 entries: 5 * 1 = 5 fillers, 5 * 10 = 50 words
      expect(n.fillerCount).toBe(5)
      expect(n.wordCount).toBe(50)
    })

    it('resets sliding window on newTopic', () => {
      const { result } = renderHook(() => useNotificationState())

      // Accumulate some data
      act(() => {
        result.current.processNotification({
          role: 'interviewee',
          hint: [],
          fillerCount: 5,
          wordCount: 50,
          newTopic: false,
          offTopic: false,
        })
      })

      // New topic resets the window
      act(() => {
        result.current.processNotification({
          role: 'interviewee',
          hint: ['New topic hint'],
          fillerCount: 1,
          wordCount: 10,
          newTopic: true,
          offTopic: false,
        })
      })

      const n = result.current.notification as IntervieweeNotificationState
      expect(n.fillerCount).toBe(1)
      expect(n.wordCount).toBe(10)
      expect(n.newTopic).toBe(true)
      expect(n.hint).toEqual(['New topic hint'])
    })

    it('tracks offTopic state', () => {
      const { result } = renderHook(() => useNotificationState())

      act(() => {
        result.current.processNotification({
          role: 'interviewee',
          hint: [],
          fillerCount: 0,
          wordCount: 10,
          newTopic: false,
          offTopic: true,
        })
      })

      const n = result.current.notification as IntervieweeNotificationState
      expect(n.offTopic).toBe(true)
    })

    it('preserves previous hint when new hint is empty', () => {
      const { result } = renderHook(() => useNotificationState())

      act(() => {
        result.current.processNotification({
          role: 'interviewee',
          hint: ['Keep talking about X'],
          fillerCount: 0,
          wordCount: 10,
          newTopic: false,
          offTopic: false,
        })
      })

      act(() => {
        result.current.processNotification({
          role: 'interviewee',
          hint: [],
          fillerCount: 0,
          wordCount: 10,
          newTopic: false,
          offTopic: false,
        })
      })

      expect(result.current.notification.hint).toEqual(['Keep talking about X'])
    })
  })
})
