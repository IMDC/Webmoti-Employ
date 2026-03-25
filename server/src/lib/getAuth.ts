import type { User } from 'better-auth'
import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { bearer } from 'better-auth/plugins'
import { getDb } from '@/db/getDb'
import { getAdminEmails } from '@/utils/admin-emails'
import { betterAuthOptions } from './better-auth-options'
import { socialBearer } from './socialBearerPlugin'

/**
 * Better Auth Instance
 *
 * This is separate from the better-auth.config.ts files since you need to pass in env at runtime
 */
export function getAuth(env: CloudflareBindings) {
  const IS_DEV = env.IS_DEV
  const db = getDb(IS_DEV
    ? env.LOCAL_DATABASE_URL
    : env.HYPERDRIVE.connectionString)

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
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    database: {
      db,
      type: 'postgres',
    },
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    // only allow emails in the allowlist or admin list
    databaseHooks: {
      user: {
        create: {
          before: async (user: User) => {
            const { email } = user
            if (!email) {
              throw new APIError('BAD_REQUEST', { message: 'Google account not allowed' })
            }

            const adminEmails = getAdminEmails(env.ADMIN_EMAILS)
            if (adminEmails.includes(email.toLowerCase())) {
              return
            }

            const allowed = await db
              .selectFrom('allowlist')
              .where('email', '=', email.toLowerCase())
              .select('id')
              .executeTakeFirst()

            if (!allowed) {
              throw new APIError('BAD_REQUEST', { message: 'Google account not allowed' })
            }
          },
        },
      },
    },
  })
}
