import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  appStore,
  useAppActions,
  useAppError,
  useAppIsColorblindModeOn,
  useAppIsSettingsOpen,
  useAppPermissionState,
} from '../useAppStore'

describe('useAppStore', () => {
  // Reset store state after each test to prevent test interference
  afterEach(() => {
    act(() => {
      appStore.setState({
        error: null,
        permissionState: 'idle',
        isSettingsOpen: false,
        isColorblindModeOn: false,
      })
    })
  })

  it('should have initial state', () => {
    const { result } = renderHook(() => ({
      error: useAppError(),
      permissionState: useAppPermissionState(),
      isSettingsOpen: useAppIsSettingsOpen(),
      isColorblindModeOn: useAppIsColorblindModeOn(),
    }))

    expect(result.current.error).toBeNull()
    expect(result.current.permissionState).toBe('idle')
    expect(result.current.isSettingsOpen).toBe(false)
    expect(result.current.isColorblindModeOn).toBe(false)
  })

  describe('setError and clearError', () => {
    it('should set and clear error', () => {
      const { result: errorResult } = renderHook(() => useAppError())
      const { result: actionsResult } = renderHook(() => useAppActions())

      // Initially no error
      expect(errorResult.current).toBeNull()

      // Set error
      act(() => {
        actionsResult.current.setError({ message: 'Test error', status: 500 })
      })

      // Error should be set
      expect(errorResult.current).toEqual({ message: 'Test error', status: 500 })

      // Clear error
      act(() => {
        actionsResult.current.clearError()
      })

      // Error should be null again
      expect(errorResult.current).toBeNull()
    })

    it('should set error with details', () => {
      const { result: errorResult } = renderHook(() => useAppError())
      const { result: actionsResult } = renderHook(() => useAppActions())

      act(() => {
        actionsResult.current.setError({
          message: 'Validation error',
          status: 400,
          details: { field: 'email' },
        })
      })

      expect(errorResult.current).toEqual({
        message: 'Validation error',
        status: 400,
        details: { field: 'email' },
      })
    })
  })

  describe('setPermissionState', () => {
    it('should update permission state', () => {
      const { result: permissionResult } = renderHook(() => useAppPermissionState())
      const { result: actionsResult } = renderHook(() => useAppActions())

      expect(permissionResult.current).toBe('idle')

      act(() => {
        actionsResult.current.setPermissionState('acquiring')
      })

      expect(permissionResult.current).toBe('acquiring')

      act(() => {
        actionsResult.current.setPermissionState('granted')
      })

      expect(permissionResult.current).toBe('granted')
    })
  })

  describe('setIsColorblindModeOn', () => {
    it('should toggle colorblind mode', () => {
      const { result: colorblindResult } = renderHook(() => useAppIsColorblindModeOn())
      const { result: actionsResult } = renderHook(() => useAppActions())

      expect(colorblindResult.current).toBe(false)

      act(() => {
        actionsResult.current.setIsColorblindModeOn(true)
      })

      expect(colorblindResult.current).toBe(true)

      act(() => {
        actionsResult.current.setIsColorblindModeOn(false)
      })

      expect(colorblindResult.current).toBe(false)
    })
  })

  describe('setIsSettingsOpen', () => {
    it('should toggle settings open state', () => {
      const { result: settingsResult } = renderHook(() => useAppIsSettingsOpen())
      const { result: actionsResult } = renderHook(() => useAppActions())

      expect(settingsResult.current).toBe(false)

      act(() => {
        actionsResult.current.setIsSettingsOpen(true)
      })

      expect(settingsResult.current).toBe(true)

      act(() => {
        actionsResult.current.setIsSettingsOpen(false)
      })

      expect(settingsResult.current).toBe(false)
    })
  })

  describe('direct store access', () => {
    it('should allow direct store manipulation', () => {
      const initialState = appStore.getState()
      expect(initialState.error).toBeNull()

      act(() => {
        appStore.setState({ error: { message: 'Direct error' } })
      })

      expect(appStore.getState().error).toEqual({ message: 'Direct error' })

      // Clean up
      act(() => {
        appStore.setState({ error: null })
      })
    })
  })
})
