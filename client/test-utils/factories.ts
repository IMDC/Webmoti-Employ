import type { DbInterviewInvite, InterviewResponse } from '@webmoti-employ/shared'

let interviewCounter = 0

/** Reset factory counters between tests if needed. */
export function resetFactories() {
  interviewCounter = 0
}

export function makeInvite(overrides: Partial<DbInterviewInvite> = {}): DbInterviewInvite {
  return {
    id: 1,
    interviewId: 1,
    email: 'invited@example.com',
    isInterviewer: false,
    ...overrides,
  }
}

export function makeInterview(overrides: Partial<InterviewResponse> = {}): InterviewResponse {
  interviewCounter++
  const now = new Date()
  return {
    id: interviewCounter,
    creatorId: 'test-user-id',
    startTime: now,
    endTime: null,
    isInstant: false,
    sessionId: crypto.randomUUID(),
    invites: [makeInvite({ interviewId: interviewCounter })],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function makeUser() {
  return {
    id: 'test-user-id',
    email: 'test@torontomu.ca',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function makeSession() {
  return {
    session: {
      id: 'test-session-id',
      userId: 'test-user-id',
      token: 'test-bearer-token',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    },
    user: makeUser(),
  }
}
