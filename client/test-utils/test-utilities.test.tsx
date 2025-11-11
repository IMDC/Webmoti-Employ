import { createMockInterview, createMockUser, renderWithAuth, renderWithQuery } from '@test-utils'
import { describe, expect, it } from 'vitest'

/**
 * Example tests demonstrating the use of test utilities for better testability
 * These are simple demonstrations of the helpers and factories
 */

describe('test utilities examples', () => {
  describe('renderWithQuery', () => {
    it('should render component with React Query context', () => {
      const TestComponent = () => <div>Test Content</div>

      const { getByText } = renderWithQuery(<TestComponent />)

      expect(getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('renderWithAuth', () => {
    it('should render component with authenticated user context', () => {
      const TestComponent = () => {
        return <div>Authenticated View</div>
      }

      const { getByText } = renderWithAuth(<TestComponent />)

      expect(getByText('Authenticated View')).toBeInTheDocument()
    })

    it('should render with custom user data', () => {
      const TestComponent = () => <div>User View</div>

      const { getByText } = renderWithAuth(
        <TestComponent />,
        { userOverrides: { name: 'Custom User' } },
      )

      expect(getByText('User View')).toBeInTheDocument()
    })
  })

  describe('mock data factories', () => {
    it('should create mock user with defaults', () => {
      const user = createMockUser()

      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('name')
    })

    it('should create mock user with overrides', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
      })

      expect(user.name).toBe('John Doe')
      expect(user.email).toBe('john@example.com')
    })

    it('should create mock interview with defaults', () => {
      const interview = createMockInterview()

      expect(interview).toHaveProperty('id')
      expect(interview).toHaveProperty('sessionId')
      expect(interview).toHaveProperty('startTime')
      expect(interview).toHaveProperty('invites')
    })

    it('should create mock interview with overrides', () => {
      const interview = createMockInterview({
        isInstant: true,
        invites: [
          {
            id: 1,
            interviewId: 1,
            email: 'test@example.com',
            isInterviewer: true,
          },
        ],
      })

      expect(interview.isInstant).toBe(true)
      expect(interview.invites).toHaveLength(1)
      expect(interview.invites[0].email).toBe('test@example.com')
    })
  })
})
