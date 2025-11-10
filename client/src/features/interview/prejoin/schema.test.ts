import { describe, expect, it } from 'vitest'
import { SessionsGetResponse } from './schema'

describe('prejoin schemas', () => {
  describe('sessionsGetResponse', () => {
    it('should validate a valid sessions response', () => {
      const validResponse = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      }

      const result = SessionsGetResponse.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should reject invalid sessionId', () => {
      const invalidResponse = {
        sessionId: 'not-a-uuid',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      }

      const result = SessionsGetResponse.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })

    it('should reject invalid JWT token', () => {
      const invalidResponse = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        token: 'not-a-jwt-token',
      }

      const result = SessionsGetResponse.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })

    it('should require both sessionId and token', () => {
      const incompleteResponse = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
      }

      const result = SessionsGetResponse.safeParse(incompleteResponse)
      expect(result.success).toBe(false)
    })

    it('should reject response with extra fields', () => {
      const responseWithExtra = {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        extraField: 'should-not-be-here',
      }

      // Zod by default allows extra fields, so this should pass
      const result = SessionsGetResponse.safeParse(responseWithExtra)
      expect(result.success).toBe(true)
    })
  })
})
