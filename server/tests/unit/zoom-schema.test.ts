import { describe, expect, it } from 'vitest'
import { ZoomToken } from '../../src/routes/sessions/schema'

describe('ZoomToken schema', () => {
  describe('sessionName validation', () => {
    it('should accept valid session names', () => {
      const validData = {
        sessionName: 'test-session-123',
        role: 1 as const,
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty session names', () => {
      const invalidData = {
        sessionName: '',
        role: 1 as const,
      }

      const result = ZoomToken.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject session names longer than 199 characters', () => {
      const invalidData = {
        sessionName: 'a'.repeat(200),
        role: 1 as const,
      }

      const result = ZoomToken.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept session names exactly 199 characters', () => {
      const validData = {
        sessionName: 'a'.repeat(199),
        role: 1 as const,
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('role validation', () => {
    it('should accept role 0', () => {
      const validData = {
        sessionName: 'test',
        role: 0 as const,
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept role 1', () => {
      const validData = {
        sessionName: 'test',
        role: 1 as const,
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject other role values', () => {
      const invalidData = {
        sessionName: 'test',
        role: 2,
      }

      const result = ZoomToken.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('expirationSeconds validation', () => {
    it('should accept valid expiration within range', () => {
      const validData = {
        sessionName: 'test',
        role: 1 as const,
        expirationSeconds: 3600,
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept minimum value (1800)', () => {
      const validData = {
        sessionName: 'test',
        role: 1 as const,
        expirationSeconds: 1800,
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept maximum value (172800)', () => {
      const validData = {
        sessionName: 'test',
        role: 1 as const,
        expirationSeconds: 172800,
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject values below 1800', () => {
      const invalidData = {
        sessionName: 'test',
        role: 1 as const,
        expirationSeconds: 1799,
      }

      const result = ZoomToken.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject values above 172800', () => {
      const invalidData = {
        sessionName: 'test',
        role: 1 as const,
        expirationSeconds: 172801,
      }

      const result = ZoomToken.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept undefined expiration', () => {
      const validData = {
        sessionName: 'test',
        role: 1 as const,
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should coerce string numbers to numbers', () => {
      const validData = {
        sessionName: 'test',
        role: 1 as const,
        expirationSeconds: '3600',
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.expirationSeconds).toBe(3600)
        expect(typeof result.data.expirationSeconds).toBe('number')
      }
    })
  })

  describe('optional fields', () => {
    it('should accept userIdentity', () => {
      const validData = {
        sessionName: 'test',
        role: 1 as const,
        userIdentity: 'user123',
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject userIdentity longer than 34 characters', () => {
      const invalidData = {
        sessionName: 'test',
        role: 1 as const,
        userIdentity: 'a'.repeat(35),
      }

      const result = ZoomToken.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept sessionKey', () => {
      const validData = {
        sessionName: 'test',
        role: 1 as const,
        sessionKey: 'key123',
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject sessionKey longer than 35 characters', () => {
      const invalidData = {
        sessionName: 'test',
        role: 1 as const,
        sessionKey: 'a'.repeat(36),
      }

      const result = ZoomToken.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept all optional fields together', () => {
      const validData = {
        sessionName: 'test',
        role: 1 as const,
        expirationSeconds: 3600,
        userIdentity: 'user123',
        sessionKey: 'key123',
        geoRegions: 'US',
        cloudRecordingOption: 1 as const,
        cloudRecordingElection: 0 as const,
        telemetryTrackingId: 'telemetry123',
        videoWebRtcMode: 1 as const,
        audioWebRtcMode: 0 as const,
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('cloudRecordingOption validation', () => {
    it('should accept 0', () => {
      const validData = {
        sessionName: 'test',
        role: 1 as const,
        cloudRecordingOption: 0 as const,
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept 1', () => {
      const validData = {
        sessionName: 'test',
        role: 1 as const,
        cloudRecordingOption: 1 as const,
      }

      const result = ZoomToken.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject other values', () => {
      const invalidData = {
        sessionName: 'test',
        role: 1 as const,
        cloudRecordingOption: 2,
      }

      const result = ZoomToken.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
