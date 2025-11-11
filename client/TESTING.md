# Testing Guide

This guide documents the testing utilities and approaches for the WebMoti-Employ client application.

## Test Utilities

The project provides several utilities to make testing easier and more consistent.

### Mock Data Factories (`test-utils/factories.ts`)

Factory functions help create reusable mock data for tests:

```typescript
import { createMockInterview, createMockSession, createMockUser } from '@test-utils'

// Create a mock user with defaults
const user = createMockUser()

// Create a mock user with custom properties
const admin = createMockUser({
  name: 'Admin User',
  email: 'admin@example.com'
})

// Create a mock interview session
const interview = createMockInterview({
  isInstant: true,
  startTime: new Date('2024-12-01T09:00:00Z')
})

// Create multiple mock users
const users = createMockUsers(5)
```

### Render Helpers (`test-utils/render-helpers.tsx`)

Render helpers provide components with necessary context providers:

#### `renderWithQuery`
Renders components that use React Query hooks:

```tsx
import { renderWithQuery } from '@test-utils'

it('should fetch data', () => {
  const { getByText } = renderWithQuery(<MyQueryComponent />)
  expect(getByText('Loading...')).toBeInTheDocument()
})
```

#### `renderWithAuth`
Renders components that need authentication context:

```tsx
import { renderWithAuth } from '@test-utils'

it('should show user info', () => {
  const { getByText } = renderWithAuth(
    <UserProfile />,
    { userOverrides: { name: 'Test User' } },
  )
  expect(getByText('Test User')).toBeInTheDocument()
})
```

#### `renderWithRouter`
Renders components that use React Router:

```tsx
import { renderWithRouter } from '@test-utils'

it('should navigate', () => {
  const { history } = renderWithRouter(<NavComponent />, {
    initialPath: '/dashboard',
  })
  // Test navigation
})
```

#### `renderWithProviders`
Renders components with all providers (Router, Query, Auth):

```tsx
import { renderWithProviders } from '@test-utils'

it('should work with all contexts', () => {
  const { getByText, history } = renderWithProviders(
    <ComplexComponent />,
    {
      initialPath: '/interview',
      userOverrides: { name: 'Test User' },
    },
  )
})
```

## Testing Complex Hooks

### Testing Hooks with External Dependencies

Some hooks have external dependencies that need to be mocked:

#### `useFaceDetection`
This hook depends on MediaPipe and the Electron API. To test components using this hook:

```typescript
import { vi } from 'vitest'

beforeEach(() => {
  // Mock the Electron API
  vi.stubGlobal('electron', {
    getModelBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
  })
})

it('should handle face detection', () => {
  const video = document.createElement('video')
  // Test the hook with mocked dependencies
})
```

#### `useGazeStats`
This hook subscribes to Electron IPC events. To test it:

```typescript
import { vi } from 'vitest'

beforeEach(() => {
  const mockUnsubscribe = vi.fn()
  vi.stubGlobal('electron', {
    subscribeToGazeStats: vi.fn((callback) => {
      // Simulate receiving stats
      callback({ gazePosition: { x: 0.5, y: 0.5 } })
      return mockUnsubscribe
    })
  })
})

it('should receive gaze stats', () => {
  // Test the hook
})
```

### Unit vs Integration Tests

- **Unit tests**: Test individual functions and utilities in isolation
  - Example: `calendar.test.ts` tests the `openGoogleCalendarTab` function

- **Integration tests**: Test components with their dependencies
  - Use render helpers to provide necessary context
  - Example: Testing a form component with validation and API calls

## Best Practices

1. **Keep tests focused**: Each test should verify one behavior
2. **Use factories for mock data**: Avoid duplicating mock data creation
3. **Use appropriate render helpers**: Choose the minimal context needed
4. **Mock external dependencies**: Use `vi.stubGlobal()` for window/electron APIs
5. **Clean up after tests**: Use `beforeEach` and `afterEach` for setup/teardown
6. **Test user behavior**: Focus on what users see and do, not implementation details

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm vitest:watch

# Run specific test file
pnpm test path/to/test.test.ts

# Run tests with coverage
pnpm vitest --coverage
```

## Examples

See the following files for testing examples:
- `test-utils/test-utilities.test.tsx` - Examples of using test utilities
- `src/utils/calendar.test.ts` - Example of testing extracted utility functions
- `src/components/GoogleAvatar.test.tsx` - Example of testing React components
- `src/features/interview/session/hooks/useCountup.test.ts` - Example of testing custom hooks
