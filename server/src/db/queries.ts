import { Kysely } from "kysely";
import { DB } from "./schema";

export async function getAllInterviews(db: Kysely<DB>) {
  return await db.selectFrom("interview").selectAll().execute();
}

export async function createInterview(
  db: Kysely<DB>,
  creatorId: string,
  startTime: Date,
  endTime: Date
) {
  return await db
    .insertInto("interview")
    .values({ creatorId, startTime, endTime })
    .executeTakeFirst();
}

export async function deleteInterview(db: Kysely<DB>, interviewId: number) {
  return await db
    .deleteFrom("interview")
    .where("interview.id", "=", interviewId)
    .executeTakeFirst();
}

export async function modifyInterview(
  db: Kysely<DB>,
  interviewId: number,
  startTime?: Date,
  endTime?: Date
) {
  const updates: Record<string, Date> = {};
  if (startTime !== undefined) updates.startTime = startTime;
  if (endTime !== undefined) updates.endTime = endTime;
  if (Object.keys(updates).length === 0) return;

  return await db
    .updateTable("interview")
    .set(updates)
    .where("interview.id", "=", interviewId)
    .executeTakeFirst();
}
