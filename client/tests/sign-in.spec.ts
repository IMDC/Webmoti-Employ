import { expect, test } from '@playwright/test'

test.describe('Sign-in page', () => {
  test('renders the sign-in card and Google button', async ({ page }) => {
    await page.goto('/sign-in')

    await expect(page.getByText('Continue to WebMoti-Employ')).toBeVisible()
    await expect(page.getByText('Sign in with your Google account')).toBeVisible()
    await expect(page.getByAltText('Continue with Google')).toBeVisible()
  })

  test('shows error notification from query param', async ({ page }) => {
    await page.goto('/sign-in?error=access_denied')

    await expect(page.getByText('Error signing in')).toBeVisible()
    await expect(page.getByText('access denied')).toBeVisible()
  })

  test('redirects to dashboard if already signed in', async ({ page }) => {
    await page.addInitScript(() => {
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      localStorage.setItem('bearer_token', encodeURIComponent('test-bearer-token'))
      localStorage.setItem('bearer_token_expiry', expiry)
    })

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

    await page.route('**/api/auth/get-session', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSession),
      }))

    await page.route('**/api/interviews', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ interviews: [] }),
      }))

    await page.goto('/sign-in')

    // should redirect to dashboard since already authenticated
    await expect(page).toHaveURL('/')
  })
})
