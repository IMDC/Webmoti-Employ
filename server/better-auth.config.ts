/**
 * Better Auth CLI configuration file
 *
 * Docs: https://www.better-auth.com/docs/concepts/cli
 *
 * This is separate from the getAuth.ts file since we need to use process.env here
 *
 */
import { betterAuth } from 'better-auth'
import { getDb } from './src/db/getDb'
import { betterAuthOptions } from './src/lib/better-auth-options'

// eslint-disable-next-line node/prefer-global/process
const { DATABASE_URL, BETTER_AUTH_URL, BETTER_AUTH_SECRET } = process.env

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  ...betterAuthOptions,
  database: {
    db: getDb(DATABASE_URL),
    type: 'postgres',
  },
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
})
