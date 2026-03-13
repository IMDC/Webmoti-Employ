/**
 * Test authentication helpers.
 *
 * Provides mock user/session data and auth header utilities.
 * Each test file should use vi.mock('@/lib/getAuth') with these constants.
 */

export const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  emailVerified: true,
  name: 'Test User',
  image: 'https://example.com/avatar.jpg',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

export const TEST_SESSION = {
  id: 'test-session-id',
  userId: 'test-user-id',
  token: 'test-bearer-token',
  expiresAt: new Date(Date.now() + 86400000),
  ipAddress: '127.0.0.1',
  userAgent: 'vitest',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

export const OTHER_USER = {
  id: 'other-user-id',
  email: 'other@example.com',
  emailVerified: true,
  name: 'Other User',
  image: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
}

/**
 * Returns headers object for an authenticated request.
 */
export function authHeaders(token: string = TEST_SESSION.token): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  }
}

/**
 * Returns headers for an authenticated JSON request.
 */
export function jsonAuthHeaders(token: string = TEST_SESSION.token): Record<string, string> {
  return {
    ...authHeaders(token),
    'Content-Type': 'application/json',
  }
}
