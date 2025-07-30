import type { DB } from './schema'
import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'

export function getDb(dbUrl: string) {
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      // Workers are stateless and you can't reuse a pool, but
      // PostgresDialect only accepts a Pool and not a Client.
      pool: new Pool({ connectionString: dbUrl }),
    }),
    // this plugin makes it so when you get data from the db, it uses camelcase
    plugins: [new CamelCasePlugin()],
  })
  return db
}
