# Web-Employ React Client

## Setup

### Clerk

We use clerk to manage authentication.

#### Clerk Setup

1. Get `VITE_CLERK_PUBLISHABLE_KEY` from clerk dashboard and add it to `.env`
2. Run app and sign in yourself to finish clerk setup

#### Setup Allowlist

This restricts the app to only people with a TMU Google account.

Note: This is a paid feature and will only work in Clerk developement mode. For production, use [Better Auth](https://www.better-auth.com/) instead of Clerk. In production, you'll also need to make a Google OAuth client and publish it.

1. Go to <https://dashboard.clerk.com/last-active?path=user-authentication/restrictions>
2. In the Allowlist section, toggle on Enable allowlist.
3. Add `torontomu.ca` to the allowlist
4. Save changes
