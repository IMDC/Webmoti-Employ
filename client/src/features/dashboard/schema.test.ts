import { describe, expect, it } from 'vitest'
import { JoinCodeInput, ScheduleInterviewForm } from './schema'

describe('dashboard schemas', () => {
  describe('ScheduleInterviewForm', () => {
    it('should validate a valid schedule interview form', () => {
      const validForm = {
        date: '2025-01-15',
        startTime: '09:00:00',
        invites: [
          {
            email: 'test@example.com',
            isInterviewer: true,
          },
        ],
        openGoogleCalendar: false,
      }

      const result = ScheduleInterviewForm.safeParse(validForm)
      expect(result.success).toBe(true)
    })

    it('should reject invalid date format', () => {
      const invalidForm = {
        date: 'invalid-date',
        startTime: '09:00:00',
        invites: [],
        openGoogleCalendar: false,
      }

      const result = ScheduleInterviewForm.safeParse(invalidForm)
      expect(result.success).toBe(false)
    })

    it('should reject invalid time format', () => {
      const invalidForm = {
        date: '2025-01-15',
        startTime: '25:00:00',
        invites: [],
        openGoogleCalendar: false,
      }

      const result = ScheduleInterviewForm.safeParse(invalidForm)
      expect(result.success).toBe(false)
    })

    it('should require all fields', () => {
      const incompleteForm = {
        date: '2025-01-15',
      }

      const result = ScheduleInterviewForm.safeParse(incompleteForm)
      expect(result.success).toBe(false)
    })

    it('should validate invites array', () => {
      const validForm = {
        date: '2025-01-15',
        startTime: '09:00:00',
        invites: [
          {
            email: 'interviewer@example.com',
            isInterviewer: true,
          },
          {
            email: 'candidate@example.com',
            isInterviewer: false,
          },
        ],
        openGoogleCalendar: true,
      }

      const result = ScheduleInterviewForm.safeParse(validForm)
      expect(result.success).toBe(true)
    })
  })

  describe('JoinCodeInput', () => {
    it('should validate a valid UUID v4', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000'
      const result = JoinCodeInput.safeParse(validUuid)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID format', () => {
      const invalidUuid = 'not-a-uuid'
      const result = JoinCodeInput.safeParse(invalidUuid)
      expect(result.success).toBe(false)
    })

    it('should reject empty string', () => {
      const result = JoinCodeInput.safeParse('')
      expect(result.success).toBe(false)
    })

    it('should reject UUID v1 (wrong version)', () => {
      // UUID v1 format
      const uuidV1 = '550e8400-e29b-11d4-a716-446655440000'
      const result = JoinCodeInput.safeParse(uuidV1)
      expect(result.success).toBe(false)
    })
  })
})
