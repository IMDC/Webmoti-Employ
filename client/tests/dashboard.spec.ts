import { expect, test } from '@playwright/test'

const mockSession = {
  session: {
    id: 'test-session-id',
    userId: 'test-user-id',
    token: 'test-bearer-token',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    ipAddress: '127.0.0.1',
    userAgent: 'playwright',
  },
  user: {
    id: 'test-user-id',
    email: 'test@torontomu.ca',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}

test.describe('Dashboard', () => {
  test('opens the dashboard after signing in', async ({ page }) => {
    // set bearer token in localStorage before the page loads so the auth guard doesn't redirect
    await page.addInitScript(() => {
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      localStorage.setItem('bearer_token', encodeURIComponent('test-bearer-token'))
      localStorage.setItem('bearer_token_expiry', expiry)
    })

    // intercept the better-auth session check
    await page.route('**/api/auth/get-session', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSession),
      }))

    // intercept the interviews list so the dashboard renders without errors
    await page.route('**/api/interviews', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ interviews: [] }),
      }))

    await page.goto('/')

    await expect(page.getByText('Welcome Test!')).toBeVisible()
    await expect(page).toHaveURL('/')
  })
})
