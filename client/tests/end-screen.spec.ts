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

function setupAuth(page: import('@playwright/test').Page) {
  return page.addInitScript(() => {
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    localStorage.setItem('bearer_token', encodeURIComponent('test-bearer-token'))
    localStorage.setItem('bearer_token_expiry', expiry)
  })
}

function mockSessionRoute(page: import('@playwright/test').Page) {
  return page.route('**/api/auth/get-session', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSession),
    }))
}

test.describe('End screen', () => {
  test('redirects to dashboard when fromInterview flag is not set', async ({ page }) => {
    await setupAuth(page)
    await mockSessionRoute(page)

    await page.route('**/api/interviews', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ interviews: [] }),
      }))

    await page.goto('/end/some-session-id')

    // should redirect back to dashboard since sessionStorage flag is missing
    await expect(page).toHaveURL('/')
  })

  test('renders end screen when fromInterview flag is set', async ({ page }) => {
    await setupAuth(page)
    await mockSessionRoute(page)

    // set the fromInterview flag before navigation
    await page.addInitScript(() => {
      sessionStorage.setItem('fromInterview', '1')
    })

    await page.goto('/end/some-session-id')

    await expect(page.getByText('Thanks for attending the interview')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Rejoin' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go to Dashboard' })).toBeVisible()
  })
})
