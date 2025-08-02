import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { bearer } from 'better-auth/plugins'
import { getDb } from '@/db/getDb'
import { betterAuthOptions } from './better-auth-options'

/**
 * Better Auth Instance
 *
 * This is separate from the better-auth.config.ts files since you need to pass in env at runtime
 */
export function getAuth(env: CloudflareBindings): ReturnType<typeof betterAuth> {
  const IS_DEV = !!env.LOCAL_DATABASE_URL

  return betterAuth({
    ...betterAuthOptions,
    plugins: [bearer()],
    trustedOrigins: [env.CORS_ORIGIN],
    socialProviders: {
      google: {
        // always ask to select account (for chrome)
        prompt: 'select_account',
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    database: {
      // use local db when provided
      db: getDb(IS_DEV
        ? env.LOCAL_DATABASE_URL
        : env.HYPERDRIVE.connectionString),
      type: 'postgres',
    },
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    // only allow TMU accounts
    databaseHooks: {
      user: {
        create: {
          before: async ({ email }) => {
            if (!email?.toLowerCase().endsWith('@torontomu.ca')) {
              throw new APIError('BAD_REQUEST', { message: 'Google account not allowed' })
            }
          },
        },
      },
    },
  })
}
