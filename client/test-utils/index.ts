import userEvent from '@testing-library/user-event'

// Export test factories
export * from './factories'
export { render } from './render'
export { userEvent }

// Export render helpers for integration tests
export {
  renderWithAuth,
  renderWithProviders,
  renderWithQuery,
  renderWithRouter,
} from './render-helpers'

export * from '@testing-library/react'
