import { describe, expect, it } from 'vitest'
import { createUserStore } from './createUserStore'

describe('createUserStore', () => {
  it('should create a store with valid session and user', () => {
    const session = {
      session: {
        id: 'session-123',
        userId: 'user-123',
        expiresAt: new Date(),
      },
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }

    const store = createUserStore(session)
    expect(store).toBeDefined()

    const state = store.getState()
    expect(state.session).toEqual(session.session)
    expect(state.user).toEqual(session.user)
  })

  it('should throw error when session is missing', () => {
    const invalidSession = {
      session: null,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }

    expect(() => createUserStore(invalidSession as any)).toThrow('Session not found')
  })

  it('should throw error when user is missing', () => {
    const invalidSession = {
      session: {
        id: 'session-123',
        userId: 'user-123',
        expiresAt: new Date(),
      },
      user: null,
    }

    expect(() => createUserStore(invalidSession as any)).toThrow('User not found')
  })

  it('should throw error when both session and user are missing', () => {
    const invalidSession = {
      session: null,
      user: null,
    }

    expect(() => createUserStore(invalidSession as any)).toThrow('Session not found')
  })

  it('should create store with correct user email', () => {
    const testEmail = 'alice@example.com'
    const session = {
      session: {
        id: 'session-456',
        userId: 'user-456',
        expiresAt: new Date(),
      },
      user: {
        id: 'user-456',
        email: testEmail,
        name: 'Alice Smith',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }

    const store = createUserStore(session)
    const state = store.getState()
    expect(state.user.email).toBe(testEmail)
  })

  it('should maintain session expiry date', () => {
    const expiryDate = new Date('2025-12-31')
    const session = {
      session: {
        id: 'session-789',
        userId: 'user-789',
        expiresAt: expiryDate,
      },
      user: {
        id: 'user-789',
        email: 'bob@example.com',
        name: 'Bob Jones',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }

    const store = createUserStore(session)
    const state = store.getState()
    expect(state.session.expiresAt).toBe(expiryDate)
  })
})
