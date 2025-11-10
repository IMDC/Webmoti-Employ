import { act, renderHook } from '@test-utils'
import { describe, expect, it, vi } from 'vitest'
import { useCountup } from './useCountup'

describe('useCountup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should initialize with 0 seconds', () => {
    const { result } = renderHook(() => useCountup())
    expect(result.current.countupSeconds).toBe(0)
  })

  it('should count up when started', () => {
    const { result } = renderHook(() => useCountup())

    act(() => {
      result.current.startCountup()
    })

    expect(result.current.countupSeconds).toBe(0)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.countupSeconds).toBe(1)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.countupSeconds).toBe(3)
  })

  it('should stop counting when stopped', () => {
    const { result } = renderHook(() => useCountup())

    act(() => {
      result.current.startCountup()
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.countupSeconds).toBe(3)

    act(() => {
      result.current.stopCountup()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Should still be 3 since we stopped it
    expect(result.current.countupSeconds).toBe(3)
  })

  it('should reset to 0 when restarted', () => {
    const { result } = renderHook(() => useCountup())

    act(() => {
      result.current.startCountup()
    })

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.countupSeconds).toBe(5)

    act(() => {
      result.current.startCountup()
    })

    expect(result.current.countupSeconds).toBe(0)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.countupSeconds).toBe(2)
  })

  it('should clear interval on stop', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const { result } = renderHook(() => useCountup())

    act(() => {
      result.current.startCountup()
    })

    act(() => {
      result.current.stopCountup()
    })

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('should handle multiple stop calls safely', () => {
    const { result } = renderHook(() => useCountup())

    act(() => {
      result.current.startCountup()
    })

    act(() => {
      result.current.stopCountup()
      result.current.stopCountup()
      result.current.stopCountup()
    })

    // Should not throw error
    expect(result.current.countupSeconds).toBe(0)
  })
})
