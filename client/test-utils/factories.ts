import type { InterviewResponse } from '@webmoti-employ/shared'
import type { User } from '@/lib/auth-client'

/**
 * Factory functions for creating mock data in tests
 */

/**
 * Creates a mock user object for testing
 * @param overrides - Partial user object to override defaults
 * @returns Mock user with sensible defaults
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    emailVerified: false,
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

/**
 * Creates a mock interview session for testing
 * @param overrides - Partial interview object to override defaults
 * @returns Mock interview session with sensible defaults
 */
export function createMockInterview(overrides?: Partial<InterviewResponse>): InterviewResponse {
  return {
    id: 1,
    creatorId: 'test-user-id',
    startTime: new Date('2024-12-01T09:00:00Z'),
    endTime: new Date('2024-12-01T10:00:00Z'),
    isInstant: false,
    sessionId: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    invites: [],
    ...overrides,
  }
}

/**
 * Creates a mock session object for authentication testing
 * @param userOverrides - Partial user object to override defaults
 * @returns Mock session with user
 */
export function createMockSession(userOverrides?: Partial<User>) {
  return {
    session: {
      id: 'test-session-id',
      userId: userOverrides?.id || 'test-user-id',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      token: 'test-token',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    user: createMockUser(userOverrides),
  }
}

/**
 * Creates multiple mock users for testing lists
 * @param count - Number of users to create
 * @returns Array of mock users
 */
export function createMockUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) => createMockUser({
    id: `test-user-id-${i}`,
    email: `test${i}@example.com`,
    name: `Test User ${i}`,
  }))
}

/**
 * Creates multiple mock interview sessions for testing lists
 * @param count - Number of interviews to create
 * @returns Array of mock interview sessions
 */
export function createMockInterviews(count: number): InterviewResponse[] {
  return Array.from({ length: count }, (_, i) => createMockInterview({
    id: i + 1,
    sessionId: `session-${i}`,
  }))
}
