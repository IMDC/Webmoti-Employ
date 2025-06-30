import { Kysely } from "kysely";
import { DB } from "./schema";

export async function getAllInterviews(db: Kysely<DB>) {
  return await db.selectFrom("interview").selectAll().execute();
}
