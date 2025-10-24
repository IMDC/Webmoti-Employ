import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DateTime } from 'luxon'
import {
  formatAppError,
  getFirstName,
  getHighlightColor,
  getInterviewLink,
  isElectron,
  jsonStringifyIndented,
} from '../utils'

describe('utility functions', () => {
  describe('jsonStringifyIndented', () => {
    it('should stringify objects with indentation', () => {
      const obj = { name: 'test', value: 123 }
      const result = jsonStringifyIndented(obj)
      expect(result).toBe(JSON.stringify(obj, null, 2))
    })

    it('should handle nested objects', () => {
      const obj = { user: { name: 'John', age: 30 }, items: [1, 2, 3] }
      const result = jsonStringifyIndented(obj)
      expect(result).toContain('  "user"')
      expect(result).toContain('    "name"')
    })
  })

  describe('formatAppError', () => {
    it('should format error with status, message, and details', () => {
      const error = {
        status: 404,
        message: 'Not found',
        details: 'Resource does not exist',
      }
      const result = formatAppError(error)
      expect(result).toContain('Status: 404')
      expect(result).toContain('Message: Not found')
      expect(result).toContain('Details: Resource does not exist')
    })

    it('should format error with only message', () => {
      const error = { message: 'Something went wrong' }
      const result = formatAppError(error)
      expect(result).toBe('Message: Something went wrong')
      expect(result).not.toContain('Status:')
    })

    it('should format error with object details', () => {
      const error = {
        message: 'Validation error',
        details: { field: 'email', reason: 'invalid' },
      }
      const result = formatAppError(error)
      expect(result).toContain('Message: Validation error')
      expect(result).toContain('Details:')
      expect(result).toContain('"field"')
      expect(result).toContain('"email"')
    })

    it('should skip empty message', () => {
      const error = { message: '', status: 500 }
      const result = formatAppError(error)
      expect(result).toBe('Status: 500')
    })
  })

  describe('getInterviewLink', () => {
    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:5173' },
        writable: true,
      })
    })

    it('should generate correct interview link', () => {
      const sessionId = 'abc123'
      const result = getInterviewLink(sessionId)
      expect(result).toBe('http://localhost:5173/interview/abc123')
    })
  })

  describe('getHighlightColor', () => {
    it('should return black for colorblind mode', () => {
      expect(getHighlightColor(true)).toBe('black')
    })

    it('should return red for normal mode', () => {
      expect(getHighlightColor(false)).toBe('red')
    })
  })

  describe('isElectron', () => {
    it('should return true when electron exists in window', () => {
      (window as any).electron = {}
      expect(isElectron()).toBe(true)
      delete (window as any).electron
    })

    it('should return false when electron does not exist in window', () => {
      expect(isElectron()).toBe(false)
    })
  })

  describe('getFirstName', () => {
    it('should extract first name from full name', () => {
      expect(getFirstName('John Doe')).toBe('John')
      expect(getFirstName('Mary Jane Smith')).toBe('Mary')
    })

    it('should return the whole name if no space', () => {
      expect(getFirstName('SingleName')).toBe('SingleName')
    })

    it('should handle empty string', () => {
      expect(getFirstName('')).toBe('')
    })
  })

  describe('bearer token functions', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    describe('setLocalBearerToken and getLocalBearerToken', () => {
      it('should store and retrieve bearer token', async () => {
        const { setLocalBearerToken, getLocalBearerToken } = await import('../utils')
        const token = 'test-bearer-token'

        setLocalBearerToken(token)
        const retrieved = getLocalBearerToken()

        expect(retrieved).toBe(encodeURIComponent(token))
      })

      it('should return null if token is expired', async () => {
        const { setLocalBearerToken, getLocalBearerToken } = await import('../utils')

        // Mock an expired token by manually setting it with old expiry
        const expiredDate = DateTime.now().minus({ days: 8 }).toISO()
        localStorage.setItem('bearer_token', 'expired-token')
        localStorage.setItem('bearer_token_expiry', expiredDate)

        const retrieved = getLocalBearerToken()
        expect(retrieved).toBeNull()
        expect(localStorage.getItem('bearer_token')).toBeNull()
      })

      it('should return null if no token exists', async () => {
        const { getLocalBearerToken } = await import('../utils')
        expect(getLocalBearerToken()).toBeNull()
      })
    })

    describe('removeLocalBearerToken', () => {
      it('should remove bearer token from localStorage', async () => {
        const { setLocalBearerToken, removeLocalBearerToken, getLocalBearerToken } = await import('../utils')

        setLocalBearerToken('test-token')
        expect(getLocalBearerToken()).not.toBeNull()

        removeLocalBearerToken()
        expect(getLocalBearerToken()).toBeNull()
      })
    })
  })

  describe('clearUrlParam', () => {
    it('should remove URL parameter if it exists', async () => {
      const { clearUrlParam } = await import('../utils')

      // Mock window.location.href and window.history.replaceState
      const mockReplaceState = vi.fn()
      const originalLocation = window.location
      const url = new URL('http://localhost:5173/?redirect=/interview&other=value')

      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, href: url.href },
        writable: true,
        configurable: true,
      })

      Object.defineProperty(window.history, 'replaceState', {
        value: mockReplaceState,
        writable: true,
        configurable: true,
      })

      clearUrlParam('redirect')

      expect(mockReplaceState).toHaveBeenCalled()
      // Check that the new URL doesn't include the redirect param
      const newUrl = mockReplaceState.mock.calls[0][2]
      expect(newUrl).not.toContain('redirect=')
      expect(newUrl).toContain('other=value')

      // Restore
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      })
    })
  })
})
