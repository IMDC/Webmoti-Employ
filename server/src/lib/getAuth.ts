import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { bearer } from 'better-auth/plugins'
import { getDb } from '@/db/getDb'
import { betterAuthOptions } from './better-auth-options'
import { socialBearer } from './socialBearerPlugin'

/**
 * Better Auth Instance
 *
 * This is separate from the better-auth.config.ts files since you need to pass in env at runtime
 */
export function getAuth(env: CloudflareBindings): ReturnType<typeof betterAuth> {
  const IS_DEV = env.IS_DEV

  return betterAuth({
    ...betterAuthOptions,
    plugins: [
      bearer(),
      socialBearer(),
    ],
    trustedOrigins: [env.CORS_ORIGIN],
    socialProviders: {
      google: {
        // always ask to select account (for chrome)
        prompt: 'select_account',
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    account: {
      // this is a workaround to fix "state_mismatch" error when signing in with better-auth@1.4 and above
      skipStateCookieCheck: true,
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
    // only allow TMU accounts and whitelisted emails
    databaseHooks: {
      user: {
        create: {
          before: async ({ email }) => {
            const isTmu = email?.toLowerCase().endsWith('@torontomu.ca')
            const allowedEmails = env.ALLOWED_EMAILS?.split(',').map(e => e.trim().toLowerCase()) ?? []
            const isWhitelisted = email ? allowedEmails.includes(email.toLowerCase()) : false

            if (!isTmu && !isWhitelisted) {
              throw new APIError('BAD_REQUEST', { message: 'Google account not allowed' })
            }
          },
        },
      },
    },
  })
}
