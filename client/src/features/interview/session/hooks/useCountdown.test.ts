import { act, renderHook } from '@test-utils'
import { describe, expect, it, vi } from 'vitest'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should initialize with 0 seconds', () => {
    const { result } = renderHook(() => useCountdown())
    expect(result.current.countdownSeconds).toBe(0)
  })

  it('should count down from given seconds', () => {
    const { result } = renderHook(() => useCountdown())

    act(() => {
      result.current.startCountdown(5)
    })

    expect(result.current.countdownSeconds).toBe(5)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.countdownSeconds).toBe(4)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.countdownSeconds).toBe(2)
  })

  it('should stop at 0 automatically', () => {
    const { result } = renderHook(() => useCountdown())

    act(() => {
      result.current.startCountdown(3)
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.countdownSeconds).toBe(0)

    // Advance more time, should stay at 0
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.countdownSeconds).toBe(0)
  })

  it('should reset to 0 when stopped manually', () => {
    const { result } = renderHook(() => useCountdown())

    act(() => {
      result.current.startCountdown(10)
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.countdownSeconds).toBe(7)

    act(() => {
      result.current.stopCountdown()
    })

    expect(result.current.countdownSeconds).toBe(0)
  })

  it('should reset and start from new value when restarted', () => {
    const { result } = renderHook(() => useCountdown())

    act(() => {
      result.current.startCountdown(5)
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.countdownSeconds).toBe(3)

    act(() => {
      result.current.startCountdown(10)
    })

    expect(result.current.countdownSeconds).toBe(10)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.countdownSeconds).toBe(9)
  })

  it('should clear interval when stopped', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    const { result } = renderHook(() => useCountdown())

    act(() => {
      result.current.startCountdown(5)
    })

    act(() => {
      result.current.stopCountdown()
    })

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('should handle multiple stop calls safely', () => {
    const { result } = renderHook(() => useCountdown())

    act(() => {
      result.current.startCountdown(10)
    })

    act(() => {
      result.current.stopCountdown()
      result.current.stopCountdown()
      result.current.stopCountdown()
    })

    // Should not throw error
    expect(result.current.countdownSeconds).toBe(0)
  })

  it('should handle countdown of 1 second', () => {
    const { result } = renderHook(() => useCountdown())

    act(() => {
      result.current.startCountdown(1)
    })

    expect(result.current.countdownSeconds).toBe(1)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.countdownSeconds).toBe(0)
  })

  it('should automatically clear interval when countdown reaches 0', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    const { result } = renderHook(() => useCountdown())

    act(() => {
      result.current.startCountdown(2)
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.countdownSeconds).toBe(0)
    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
