import type { InterviewResponse } from '@webmoti-employ/shared'

let interviewCounter = 0

export function makeInterview(overrides?: Partial<InterviewResponse>): InterviewResponse {
  interviewCounter++
  return {
    id: interviewCounter,
    hostId: 'test-user-id',
    startTime: new Date('2026-04-01T10:00:00Z'),
    endTime: new Date('2026-04-01T11:00:00Z'),
    sessionId: crypto.randomUUID(),
    isInstant: false,
    invites: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

export function resetFactories() {
  interviewCounter = 0
}
