import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { DB } from "./schema";
import { Pool } from "pg";

export function getDb(dbUrl: string) {
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      // the max is 1 since workers are stateless and you can't reuse a pool.
      // PostgresDialect only accepts a Pool and not a Client.
      pool: new Pool({ connectionString: dbUrl, max: 1 }),
    }),
    // this plugin makes it so when you get data from the db, it uses camelcase
    plugins: [new CamelCasePlugin()],
  });
  return db;
}
