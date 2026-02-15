/* eslint-disable node/prefer-global/process */
import { defineConfig } from 'kysely-ctl'
import { getDb } from './src/db/getDb'

const {
  MIGRATION_TARGET,
  WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE,
  DATABASE_URL,
} = process.env

if (!MIGRATION_TARGET || !WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE || !DATABASE_URL)
  throw new Error('Missing database .env variables')

const migrationUrl = MIGRATION_TARGET === 'LOCAL'
  ? WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE
  : DATABASE_URL

// run migrations on either local or remote database (depending on the set env variable)
const db = getDb(migrationUrl)

export default defineConfig({
  kysely: db,
  migrations: {
    migrationFolder: 'src/db/migrations',
  },
})
