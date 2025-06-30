import { Kysely, PostgresDialect } from "kysely";
import { DB } from "./schema";
import { Pool } from "pg";

export function getDb(dbUrl: string) {
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: dbUrl, max: 1 }),
    }),
  });
  return db;
}
