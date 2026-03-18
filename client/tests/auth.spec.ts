import { expect, test } from '@playwright/test'

test.describe('Auth (expired token)', () => {
  test('clears expired token and shows error notification', async ({ page }) => {
    // set an expired bearer token
    await page.addInitScript(() => {
      const expired = new Date(Date.now() - 86400000).toISOString()
      localStorage.setItem('bearer_token', encodeURIComponent('expired-token'))
      localStorage.setItem('bearer_token_expiry', expired)
    })

    await page.goto('/')

    // should redirect to sign-in since the token is expired
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('clears valid token when session check returns no user', async ({ page }) => {
    await page.addInitScript(() => {
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      localStorage.setItem('bearer_token', encodeURIComponent('invalid-token'))
      localStorage.setItem('bearer_token_expiry', expiry)
    })

    // session check returns null (no valid session)
    await page.route('**/api/auth/get-session', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session: null, user: null }),
      }))

    await page.goto('/')

    // should redirect to sign-in and show error
    await expect(page).toHaveURL(/\/sign-in/)
    await expect(page.getByText('Error signing in')).toBeVisible()
  })
})
