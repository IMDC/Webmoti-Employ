import { defineConfig } from 'kysely-ctl'
import { getDb } from './src/db/getDb'

// eslint-disable-next-line node/prefer-global/process
const { WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE } = process.env

// run migrations on local database
const db = getDb(WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE!)

export default defineConfig({
  kysely: db,
  migrations: {
    migrationFolder: 'src/migrations',
  },
})
