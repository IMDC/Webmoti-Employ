/* eslint-disable node/prefer-global/process */

/**
 * Better Auth CLI configuration file
 *
 * Docs: https://www.better-auth.com/docs/concepts/cli
 *
 * This is separate from the getAuth.ts file since we need to use process.env here. This file is only used for migrations.
 *
 */

import { betterAuth } from 'better-auth'
import { getMigrationDb } from './src/db/getMigrationDb'
import { betterAuthOptions } from './src/lib/better-auth-options'

const { BETTER_AUTH_URL, BETTER_AUTH_SECRET } = process.env

export const auth = betterAuth({
  ...betterAuthOptions,
  database: {
    db: getMigrationDb(),
    type: 'postgres',
  },
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
})
