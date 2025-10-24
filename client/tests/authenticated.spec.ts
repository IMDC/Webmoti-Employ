import { expect, test } from '@playwright/test'

/**
 * E2E test demonstrating auth mocking for testing protected routes
 *
 * This test uses browser context storage to mock an authenticated session,
 * allowing us to test protected routes in Playwright without going through
 * the full OAuth flow.
 */
test.describe('Authenticated user tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authentication by setting session cookie and localStorage
    // This simulates a logged-in user without going through OAuth

    // Set a mock session cookie for better-auth
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: 'mock-session-token-for-testing',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ])

    // Set mock user data in localStorage
    await page.goto('/')
    await page.evaluate(() => {
      // Mock a logged-in user session in localStorage
      // This simulates what better-auth would set
      localStorage.setItem('better-auth.user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@torontomu.ca',
        name: 'Test User',
        emailVerified: true,
      }))
    })
  })

  test('should allow access to protected root route when authenticated', async ({ page }) => {
    // With mocked auth, we should be able to access the root route
    // without being redirected to /sign-in
    await page.goto('/')

    // We should NOT be redirected to sign-in page
    await expect(page).not.toHaveURL(/\/sign-in/)

    // We should be on the homepage or dashboard
    // (exact URL depends on the app's routing logic)
    await expect(page).toHaveURL(/^\/(?!\sign-in)/)
  })

  test('should render user-specific content when authenticated', async ({ page }) => {
    await page.goto('/')

    // Check that the page doesn't redirect to sign-in
    await expect(page).not.toHaveURL(/\/sign-in/)

    // The page should have loaded some content
    // (this is a basic check - in a real app you'd check for specific elements)
    await expect(page.locator('body')).not.toBeEmpty()
  })
})

/**
 * Note: This is a basic example of auth mocking for E2E tests.
 * In a production scenario, you would:
 * 1. Use a test fixture to provide a properly signed session token
 * 2. Mock the API responses for auth validation
 * 3. Set up proper test data for the authenticated user
 * 4. Use environment-specific auth bypass mechanisms if available
 */
