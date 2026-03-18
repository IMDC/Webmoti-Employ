import { expect, test } from '@playwright/test'
import { DateTime } from 'luxon'

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

function makeInterview(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    hostId: 'test-user-id',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
    isInstant: false,
    sessionId: 'a0000000-0000-4000-a000-000000000001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    invites: [
      { id: 1, interviewId: 1, email: 'test@torontomu.ca', isInterviewer: true },
      { id: 2, interviewId: 1, email: 'candidate@torontomu.ca', isInterviewer: false },
    ],
    ...overrides,
  }
}

function setupAuth(page: import('@playwright/test').Page) {
  // set bearer token in localStorage before the page loads so the auth guard doesn't redirect
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

function mockProfilesRoute(page: import('@playwright/test').Page) {
  return page.route('**/api/profiles', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    }))
}

test.describe('Dashboard', () => {
  test('opens the dashboard after signing in', async ({ page }) => {
    await setupAuth(page)
    await mockSessionRoute(page)

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

  test('shows "no scheduled interviews" when list is empty', async ({ page }) => {
    await setupAuth(page)
    await mockSessionRoute(page)

    await page.route('**/api/interviews', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ interviews: [] }),
      }))

    await page.goto('/')

    await expect(page.getByText('You have no scheduled interviews')).toBeVisible()
  })

  test('displays scheduled interviews', async ({ page }) => {
    await setupAuth(page)
    await mockSessionRoute(page)
    await mockProfilesRoute(page)

    const now = DateTime.local()
    const todayInterview = makeInterview({
      id: 1,
      startTime: now.set({ hour: 14, minute: 0 }).toISO(),
      endTime: now.set({ hour: 15, minute: 0 }).toISO(),
    })

    await page.route('**/api/interviews', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ interviews: [todayInterview] }),
      }))

    await page.goto('/')

    // interview card should be visible with the role badge
    await expect(page.getByText('Interviewer')).toBeVisible()
  })

  test('filters interviews by tab (Today / Upcoming / Past)', async ({ page }) => {
    await setupAuth(page)
    await mockSessionRoute(page)
    await mockProfilesRoute(page)

    const now = DateTime.local()
    const todayInterview = makeInterview({
      id: 1,
      startTime: now.set({ hour: 10, minute: 0 }).toISO(),
      endTime: now.set({ hour: 11, minute: 0 }).toISO(),
      sessionId: 'a0000000-0000-4000-a000-000000000001',
    })
    const upcomingInterview = makeInterview({
      id: 2,
      startTime: now.plus({ days: 3 }).set({ hour: 10, minute: 0 }).toISO(),
      endTime: now.plus({ days: 3 }).set({ hour: 11, minute: 0 }).toISO(),
      sessionId: 'a0000000-0000-4000-a000-000000000002',
    })
    const pastInterview = makeInterview({
      id: 3,
      startTime: now.minus({ days: 3 }).set({ hour: 10, minute: 0 }).toISO(),
      endTime: now.minus({ days: 3 }).set({ hour: 11, minute: 0 }).toISO(),
      sessionId: 'a0000000-0000-4000-a000-000000000003',
    })

    await page.route('**/api/interviews', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          interviews: [todayInterview, upcomingInterview, pastInterview],
        }),
      }))

    await page.goto('/')

    // "Today" tab is active by default, should show today's interview
    await expect(page.getByText('Interviewer')).toBeVisible()

    // switch to "Upcoming" tab
    await page.getByRole('tab', { name: 'Upcoming' }).click()
    await expect(page.getByText('Interviewer')).toBeVisible()

    // switch to "Past" tab
    await page.getByRole('tab', { name: 'Past' }).click()
    await expect(page.getByText('Interviewer')).toBeVisible()
  })

  test('validates join code input', async ({ page }) => {
    await setupAuth(page)
    await mockSessionRoute(page)

    await page.route('**/api/interviews', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ interviews: [] }),
      }))

    await page.goto('/')

    const joinInput = page.getByPlaceholder('Interview code')

    // Join button should be disabled when input is empty
    await expect(page.getByRole('button', { name: 'Join' })).toBeDisabled()

    // type an invalid code
    await joinInput.fill('not-a-uuid')
    await expect(page.getByRole('button', { name: 'Join' })).toBeDisabled()
    await expect(page.getByText('Invalid interview code')).toBeVisible()

    // type a valid UUIDv4 (version nibble=4, variant nibble=a)
    await joinInput.fill('a0000000-0000-4000-a000-000000000001')
    await expect(page.getByRole('button', { name: 'Join' })).toBeEnabled()
  })
})
