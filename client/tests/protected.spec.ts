import { expect, test } from '@playwright/test'

function testRedirect(from: string) {
  test(`redirects from ${from} to /sign-in with redirect param`, async ({ page }) => {
    const encoded = encodeURIComponent(from)
    await page.goto(from)
    await expect(page).toHaveURL(`/sign-in?redirectTo=${encoded}`)
  })
}

test.describe('Protected routes', () => {
  testRedirect('/')
  testRedirect('/interview/prejoin')
})
