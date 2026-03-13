import { DateTime } from 'luxon'
import { describe, expect, it, vi } from 'vitest'
import {
  clearUrlParam,
  getFirstName,
  getHighlightColor,
  getInterviewLink,
  getLocalBearerToken,
  isElectron,
  jsonStringifyIndented,
  removeLocalBearerToken,
  setLocalBearerToken,
} from './utils'

describe('utils', () => {
  describe('jsonStringifyIndented', () => {
    it('should stringify JSON with indentation', () => {
      const obj = { name: 'test', value: 123 }
      const result = jsonStringifyIndented(obj)
      expect(result).toBe('{\n  "name": "test",\n  "value": 123\n}')
    })
  })

  describe('getInterviewLink', () => {
    it('should return interview link with session ID', () => {
      const sessionId = 'test-session-123'
      const result = getInterviewLink(sessionId)
      expect(result).toContain('/interview/test-session-123')
    })
  })

  describe('getHighlightColor', () => {
    it('should return black when colorblind mode is on', () => {
      expect(getHighlightColor(true)).toBe('black')
    })

    it('should return red when colorblind mode is off', () => {
      expect(getHighlightColor(false)).toBe('red')
    })
  })

  describe('isElectron', () => {
    it('should return false when electron is not in window', () => {
      expect(isElectron()).toBe(false)
    })
  })

  describe('getFirstName', () => {
    it('should extract first name from full name', () => {
      expect(getFirstName('John Doe')).toBe('John')
    })

    it('should return the whole name if no space', () => {
      expect(getFirstName('John')).toBe('John')
    })

    it('should handle multiple spaces', () => {
      expect(getFirstName('John Michael Doe')).toBe('John')
    })
  })

  describe('clearUrlParam', () => {
    it('should remove parameter from URL', () => {
      // Setup window.location with a parameter
      const mockUrl = 'http://localhost:3000/?test=value'
      delete (window as any).location
      window.location = new URL(mockUrl) as any

      const replaceSpy = vi.spyOn(window.history, 'replaceState')

      clearUrlParam('test')

      expect(replaceSpy).toHaveBeenCalled()
    })
  })

  describe('localStorage bearer token functions', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('should set and get bearer token', () => {
      const token = 'test-token-123'
      setLocalBearerToken(token)

      const retrieved = getLocalBearerToken()
      expect(retrieved).toBe(encodeURIComponent(token))
    })

    it('setLocalBearerToken stores both token and expiry key', () => {
      setLocalBearerToken('my-token')

      expect(localStorage.getItem('bearer_token')).toBe(encodeURIComponent('my-token'))
      expect(localStorage.getItem('bearer_token_expiry')).toBeTruthy()
    })

    it('should return null when no token exists', () => {
      const result = getLocalBearerToken()
      expect(result).toBeNull()
    })

    it('should return null and clear storage when token is expired', () => {
      const token = 'expired-token'
      localStorage.setItem('bearer_token', token)
      localStorage.setItem('bearer_token_expiry', DateTime.now().minus({ days: 1 }).toISO())

      const result = getLocalBearerToken()
      expect(result).toBeNull()
      expect(localStorage.getItem('bearer_token')).toBeNull()
    })

    it('should remove bearer token', () => {
      setLocalBearerToken('test-token')
      removeLocalBearerToken()

      expect(localStorage.getItem('bearer_token')).toBeNull()
      expect(localStorage.getItem('bearer_token_expiry')).toBeNull()
    })
  })
})
